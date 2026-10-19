package com.chasehorse.tms;

import com.chasehorse.common.ApiException;
import com.chasehorse.common.AuditService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tms")
public class TmsController {
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    private final com.chasehorse.auth.RoleAuthorization roleAuth;

    public TmsController(JdbcTemplate jdbc, AuditService audit, com.chasehorse.auth.RoleAuthorization roleAuth) {
        this.jdbc = jdbc;
        this.audit = audit;
        this.roleAuth = roleAuth;
    }

    public record VehicleView(
        UUID id, String registrationNumber, String vehicleType, BigDecimal capacityKg,
        String make, String model, String status, UUID assignedDriverId
    ) {}

    public record PlanView(
        UUID id, String planName, String vehicleType, BigDecimal maxCapacityKg,
        BigDecimal baseRateInr, BigDecimal ratePerKmInr, BigDecimal estimatedHours,
        String description
    ) {}

    public record ShipmentView(
        UUID id, String bookingRef, UUID customerId, String originAddress,
        String destinationAddress, String cargoDescription, BigDecimal cargoWeightKg,
        String status, BigDecimal totalPrice, OffsetDateTime createdAt
    ) {}

    public record TrackingEventView(
        UUID id, UUID bookingId, String eventType, String locationText,
        String notes, OffsetDateTime recordedAt
    ) {}

    public record TrackingDetailsView(
        UUID id, String bookingRef, String status, String originAddress,
        String destinationAddress, String cargoDescription, BigDecimal cargoWeightKg,
        BigDecimal totalPrice, OffsetDateTime createdAt, List<TrackingEventView> events
    ) {}

    public record PublicTrackingView(
        UUID id, String bookingRef, String status, String originAddress,
        String destinationAddress, String cargoDescription, BigDecimal cargoWeightKg,
        OffsetDateTime createdAt, List<TrackingEventView> events
    ) {}

    public record CreateShipmentRequest(
        @NotBlank String originAddress,
        @NotBlank String destinationAddress,
        String cargoDescription,
        BigDecimal cargoWeightKg,
        BigDecimal totalPrice,
        UUID transportPlanId
    ) {}

    public record RecordEventRequest(
        @NotBlank String eventType,
        String locationText,
        String notes
    ) {}

    @GetMapping("/vehicles")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'OPERATIONS', 'MANAGER', 'PARTNER')")
    public List<VehicleView> listVehicles() {
        return jdbc.query("""
            SELECT id, registration_number, vehicle_type, capacity_kg, make, model, status, assigned_driver_id
            FROM tms_vehicles ORDER BY registration_number ASC
            """,
            (rs, n) -> new VehicleView(
                rs.getObject("id", UUID.class),
                rs.getString("registration_number"),
                rs.getString("vehicle_type"),
                rs.getBigDecimal("capacity_kg"),
                rs.getString("make"),
                rs.getString("model"),
                rs.getString("status"),
                rs.getObject("assigned_driver_id", UUID.class)
            )
        );
    }

    @GetMapping("/plans")
    public List<PlanView> listPlans() {
        return jdbc.query("""
            SELECT id, name, vehicle_type, coalesce(price_per_kg, 1000) as capacity_est,
                   base_price, coalesce(price_per_km, 25) as price_per_km,
                   coalesce(estimated_duration_hours, 24) as duration, description
            FROM tms_transport_plans
            WHERE active = true
            ORDER BY base_price ASC
            """,
            (rs, n) -> new PlanView(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getString("vehicle_type"),
                rs.getBigDecimal("capacity_est"),
                rs.getBigDecimal("base_price"),
                rs.getBigDecimal("price_per_km"),
                rs.getBigDecimal("duration"),
                rs.getString("description")
            )
        );
    }

    @GetMapping("/shipments")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'OPERATIONS', 'MANAGER', 'PARTNER', 'CUSTOMER')")
    public List<ShipmentView> listShipments(@AuthenticationPrincipal Jwt jwt) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        List<String> roles = roleAuth.getRoles(jwt.getSubject());
        boolean isAdminOrOps = roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ADMIN") || r.equalsIgnoreCase("OPERATIONS") || r.equalsIgnoreCase("MANAGER") || r.equalsIgnoreCase("PARTNER"));

        String sql = """
            SELECT id, booking_ref, customer_id, origin_address, destination_address,
                   cargo_description, cargo_weight_kg, status, total_price, created_at
            FROM tms_bookings
            """ + (!isAdminOrOps ? " WHERE customer_id = ? " : "") +
            " ORDER BY created_at DESC LIMIT 100";

        Object[] params = !isAdminOrOps ? new Object[]{actorId} : new Object[]{};
        return jdbc.query(sql,
            (rs, n) -> new ShipmentView(
                rs.getObject("id", UUID.class),
                rs.getString("booking_ref"),
                rs.getObject("customer_id", UUID.class),
                rs.getString("origin_address"),
                rs.getString("destination_address"),
                rs.getString("cargo_description"),
                rs.getBigDecimal("cargo_weight_kg"),
                rs.getString("status"),
                rs.getBigDecimal("total_price"),
                rs.getObject("created_at", OffsetDateTime.class)
            ), params
        );
    }

    @PostMapping("/shipments")
    @Transactional
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'OPERATIONS', 'CUSTOMER', 'PARTNER')")
    public ShipmentView createShipment(
        @Valid @RequestBody CreateShipmentRequest request,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        UUID id = UUID.randomUUID();
        String bookingRef = "CH-TMS-" + (10000 + (System.currentTimeMillis() % 90000));

        // Authoritative server-side price calculation
        BigDecimal calculatedPrice = BigDecimal.ZERO;
        if (request.transportPlanId() != null) {
            var plans = jdbc.query(
                "SELECT base_price, price_per_kg FROM tms_transport_plans WHERE id = ?",
                (rs, n) -> Map.of(
                    "basePrice", rs.getBigDecimal("base_price"),
                    "pricePerKg", rs.getBigDecimal("price_per_kg") != null ? rs.getBigDecimal("price_per_kg") : BigDecimal.ZERO
                ),
                request.transportPlanId()
            );
            if (!plans.isEmpty()) {
                BigDecimal base = (BigDecimal) plans.get(0).get("basePrice");
                BigDecimal perKg = (BigDecimal) plans.get(0).get("pricePerKg");
                BigDecimal weight = request.cargoWeightKg() != null ? request.cargoWeightKg() : BigDecimal.ZERO;
                calculatedPrice = base.add(weight.multiply(perKg));
            }
        }
        if (calculatedPrice.compareTo(BigDecimal.ZERO) <= 0) {
            calculatedPrice = request.totalPrice() != null && request.totalPrice().compareTo(BigDecimal.ZERO) > 0
                ? request.totalPrice()
                : new BigDecimal("1500.00");
        }

        jdbc.update("""
            INSERT INTO tms_bookings (id, booking_ref, customer_id, transport_plan_id, origin_address,
                                     destination_address, cargo_description, cargo_weight_kg, total_price, status, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'INR')
            """, id, bookingRef, actorId, request.transportPlanId(), request.originAddress(), request.destinationAddress(),
            request.cargoDescription(), request.cargoWeightKg(), calculatedPrice);

        // Create initial tracking event
        jdbc.update("""
            INSERT INTO tms_tracking_events (id, booking_id, status, location_description, notes, recorded_by)
            VALUES (?, ?, 'CONFIRMED', ?, 'Booking confirmed in system', ?)
            """, UUID.randomUUID(), id, request.originAddress(), actorId);

        audit.log(actorId, "TMS_SHIPMENT_CREATED", "TMS_BOOKING", id,
            Map.of("bookingRef", bookingRef, "origin", request.originAddress(), "authoritativePrice", calculatedPrice.toString()));

        return new ShipmentView(
            id, bookingRef, actorId, request.originAddress(), request.destinationAddress(),
            request.cargoDescription(), request.cargoWeightKg(), "CONFIRMED",
            calculatedPrice, OffsetDateTime.now()
        );
    }

    @GetMapping("/tracking/{bookingRef}")
    public PublicTrackingView getTracking(@PathVariable String bookingRef) {
        List<PublicTrackingView> list = jdbc.query("""
            SELECT id, booking_ref, status, origin_address, destination_address,
                   cargo_description, cargo_weight_kg, created_at
            FROM tms_bookings
            WHERE LOWER(booking_ref) = LOWER(?)
            """,
            (rs, n) -> new PublicTrackingView(
                rs.getObject("id", UUID.class),
                rs.getString("booking_ref"),
                rs.getString("status"),
                rs.getString("origin_address"),
                rs.getString("destination_address"),
                rs.getString("cargo_description"),
                rs.getBigDecimal("cargo_weight_kg"),
                rs.getObject("created_at", OffsetDateTime.class),
                List.of()
            ),
            bookingRef
        );

        if (list.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No shipment found for reference: " + bookingRef);
        }

        PublicTrackingView base = list.get(0);
        List<TrackingEventView> events = jdbc.query("""
            SELECT id, booking_id, status, location_description, notes, created_at
            FROM tms_tracking_events
            WHERE booking_id = ?
            ORDER BY created_at ASC
            """,
            (rs, n) -> new TrackingEventView(
                rs.getObject("id", UUID.class),
                rs.getObject("booking_id", UUID.class),
                rs.getString("status"),
                rs.getString("location_description"),
                rs.getString("notes"),
                rs.getObject("created_at", OffsetDateTime.class)
            ),
            base.id()
        );

        return new PublicTrackingView(
            base.id(), base.bookingRef(), base.status(), base.originAddress(),
            base.destinationAddress(), base.cargoDescription(), base.cargoWeightKg(),
            base.createdAt(), events
        );
    }

    @PostMapping("/tracking/{bookingRef}/events")
    @Transactional
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'OPERATIONS', 'PARTNER')")
    public TrackingEventView recordEvent(
        @PathVariable String bookingRef,
        @Valid @RequestBody RecordEventRequest req,
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        UUID bookingId = jdbc.queryForObject(
            "SELECT id FROM tms_bookings WHERE LOWER(booking_ref) = LOWER(?)",
            UUID.class,
            bookingRef
        );

        if (bookingId == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Booking not found");
        }

        UUID eventId = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        jdbc.update("""
            INSERT INTO tms_tracking_events (id, booking_id, status, location_description, notes, recorded_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, eventId, bookingId, req.eventType(), req.locationText(), req.notes(), actorId, now);

        jdbc.update("UPDATE tms_bookings SET status = ?, updated_at = ? WHERE id = ?", req.eventType(), now, bookingId);

        audit.log(actorId, "TMS_EVENT_RECORDED", "TMS_TRACKING", eventId,
            Map.of("bookingRef", bookingRef, "event", req.eventType()));

        return new TrackingEventView(eventId, bookingId, req.eventType(), req.locationText(), req.notes(), now);
    }
}
