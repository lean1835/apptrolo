package com.apptrololo.backend.controller;

import com.apptrololo.backend.entity.Lodge;
import com.apptrololo.backend.entity.User;
import com.apptrololo.backend.service.LodgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lodge")
@RequiredArgsConstructor
public class LodgeController {

    private final LodgeService lodgeService;
    private final com.apptrololo.backend.repository.UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Lodge> getLodge(@AuthenticationPrincipal User user) {
        User fullUser = userRepository.findByPhone(user.getPhone()).orElse(user);
        return ResponseEntity.ok(fullUser.getLodge());
    }

    @PutMapping
    public ResponseEntity<Lodge> updateLodge(@AuthenticationPrincipal User user, @RequestBody Lodge lodgeRequest) {
        User fullUser = userRepository.findByPhone(user.getPhone()).orElse(user);
        Lodge lodge = fullUser.getLodge();
        if (lodge == null) return ResponseEntity.notFound().build();
        lodge.setName(lodgeRequest.getName());
        lodge.setAddress(lodgeRequest.getAddress());
        lodge.setPhone(lodgeRequest.getPhone());
        lodge.setBank(lodgeRequest.getBank());
        lodge.setBankName(lodgeRequest.getBankName());
        return ResponseEntity.ok(lodgeService.saveLodge(lodge));
    }
}
