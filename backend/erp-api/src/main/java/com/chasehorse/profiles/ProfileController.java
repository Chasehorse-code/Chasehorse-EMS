package com.chasehorse.profiles;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profiles")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    /* ---- DTOs ---- */
    public record SetStatusRequest(@NotBlank String status) {}
    public record AssignRoleRequest(@NotBlank String role) {}

    @GetMapping
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER', 'OPERATIONS')")
    public List<ProfileService.ProfileSummary> listProfiles() {
        return profileService.listProfiles(500);
    }

    @GetMapping("/{userId}")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN', 'MANAGER')")
    public ProfileService.ProfileView getProfile(@PathVariable UUID userId) {
        return profileService.loadFullProfile(userId);
    }

    @PatchMapping("/{userId}/status")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN')")
    public ProfileService.ProfileView setStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody SetStatusRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return profileService.setAccountStatus(userId, request.status().toUpperCase(),
            UUID.fromString(jwt.getSubject()));
    }

    @PostMapping("/{userId}/roles")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN')")
    public ProfileService.ProfileView assignRole(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignRoleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return profileService.assignRole(userId, request.role(),
            UUID.fromString(jwt.getSubject()));
    }

    @DeleteMapping("/{userId}/roles/{role}")
    @PreAuthorize("@roleAuthorization.hasAny(authentication, 'ADMIN')")
    public ProfileService.ProfileView revokeRole(
            @PathVariable UUID userId,
            @PathVariable String role,
            @AuthenticationPrincipal Jwt jwt) {
        return profileService.revokeRole(userId, role,
            UUID.fromString(jwt.getSubject()));
    }
}
