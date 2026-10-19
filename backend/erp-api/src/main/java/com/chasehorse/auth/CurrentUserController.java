package com.chasehorse.auth;

import com.chasehorse.profiles.ProfileService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Returns the current authenticated user's profile, roles, and permissions.
 * On first call, auto-creates a PENDING profile linked to the Supabase Auth identity.
 */
@RestController
@RequestMapping("/api/v1")
public class CurrentUserController {
    private final ProfileService profileService;

    public CurrentUserController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    public ProfileService.ProfileView me(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("user_metadata") != null
            ? null  // extract from nested claim if needed
            : email;

        // Try to extract display name and metadata from JWT user_metadata
        Object userMetadata = jwt.getClaim("user_metadata");
        String displayName = null;
        String phone = null;
        String region = null;
        String accountType = null;
        if (userMetadata instanceof java.util.Map<?, ?> meta) {
            Object fullName = meta.get("full_name");
            if (fullName == null) fullName = meta.get("name");
            if (fullName instanceof String s && !s.isBlank()) displayName = s;

            Object p = meta.get("phone");
            if (p instanceof String s && !s.isBlank()) phone = s;

            Object r = meta.get("region");
            if (r instanceof String s && !s.isBlank()) region = s;

            Object at = meta.get("account_type");
            if (at instanceof String s && !s.isBlank()) accountType = s;
        }
        if (displayName == null) displayName = email;

        return profileService.findOrCreate(userId, email, displayName, phone, region, accountType);
    }
}