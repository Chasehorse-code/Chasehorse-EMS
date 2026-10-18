package com.chasehorse.tms;

import com.chasehorse.common.AuditService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

    public TmsController(JdbcTemplate jdbc, AuditService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    public record VehicleView(
        UUID id, String registrationNumber, String vehicleType, BigDecimal capacityKg,
        String make, String model, String status, UUID assignedDriverId
    ) {}

    public record ShipmentView(
        UUID id, String bookingRef, UUID customerId, String originAddress,
        String destinationAddress, String cargoDescription, BigDecimal cargoWeightKg,
        String status, BigDecimal totalPrice, OffsetDateTime createdAt
    ) {}

    public record CreateShipmentRequest(
        @NotBlank String originAddress,
        @NotBlank String destinationAddress,
        String cargoDescription,
        BigDecimal cargoWeightKg,
        BigDecimal totalPrice
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

    @GetMapping("/shipments")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'OPERATIONS', 'MANAGER', 'PARTNER', 'CUSTOMER')")
    public List<ShipmentView> listShipments() {
        return jdbc.query("""
            SELECT id, booking_ref, customer_id, origin_address, destination_address,
                   cargo_description, cargo_weight_kg, status, total_price, created_at
            FROM tms_bookings ORDER BY created_at DESC LIMIT 100
            """,
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
            )
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
        String bookingRef = "CH-TMS-" + System.currentTimeMillis() % 100000;

        jdbc.update("""
            INSERT INTO tms_bookings (id, booking_ref, customer_id, origin_address, destination_address,
                                     cargo_description, cargo_weight_kg, total_price, status, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'INR')
            """, id, bookingRef, actorId, request.originAddress(), request.destinationAddress(),
            request.cargoDescription(), request.cargoWeightKg(), request.totalPrice());

        audit.log(actorId, "TMS_SHIPMENT_CREATED", "TMS_BOOKING", id,
            Map.of("bookingRef", bookingRef, "origin", request.originAddress()));

        return new ShipmentView(
            id, bookingRef, actorId, request.originAddress(), request.destinationAddress(),
            request.cargoDescription(), request.cargoWeightKg(), "CONFIRMED",
            request.totalPrice(), OffsetDateTime.now()
        );
    }
}
