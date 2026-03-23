package com.apptrololo.backend.controller;

import com.apptrololo.backend.entity.Bill;
import com.apptrololo.backend.entity.User;
import com.apptrololo.backend.repository.BillRepository;
import com.apptrololo.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillRepository billRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Bill>> getBills(@AuthenticationPrincipal User user) {
        User fullUser = userRepository.findByPhone(user.getPhone()).orElse(user);
        if (fullUser.getLodge() == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(billRepository.findAllByLodge(fullUser.getLodge()));
    }
}
