package com.apptrololo.backend.controller;

import com.apptrololo.backend.entity.User;
import com.apptrololo.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<User> getMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userRepository.findByPhone(user.getPhone()).orElse(user));
    }

    @PostMapping("/update")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal User user, @RequestBody User request) {
        User currentUser = userRepository.findByPhone(user.getPhone()).orElseThrow();
        currentUser.setName(request.getName());
        currentUser.setEmail(request.getEmail());
        return ResponseEntity.ok(userRepository.save(currentUser));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@AuthenticationPrincipal User user, @RequestBody Map<String, String> request) {
        User currentUser = userRepository.findByPhone(user.getPhone()).orElseThrow();
        if (!passwordEncoder.matches(request.get("oldPassword"), currentUser.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu cũ không chính xác"));
        }
        currentUser.setPassword(passwordEncoder.encode(request.get("newPassword")));
        userRepository.save(currentUser);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }
}
