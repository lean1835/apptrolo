package com.apptrololo.backend.controller;

import com.apptrololo.backend.entity.*;
import com.apptrololo.backend.repository.*;
import com.apptrololo.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class DataController {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final LodgeRepository lodgeRepository;
    private final UtilityPriceRepository utilityPriceRepository;
    private final MemberRepository memberRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final BillRepository billRepository;

    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> exportData(@AuthenticationPrincipal User user) {
        User fullUser = userRepository.findByPhone(user.getPhone()).orElseThrow();
        Lodge lodge = fullUser.getLodge();
        if (lodge == null) return ResponseEntity.badRequest().build();

        Map<String, Object> export = new HashMap<>();
        export.put("lodge", lodge);
        export.put("utilityPrice", lodge.getUtilityPrice());
        
        List<Room> rooms = roomRepository.findByLodge(lodge);
        export.put("rooms", rooms);
        
        // Members, Readings, Bills are already included in rooms via @OneToMany if not ignored
        // But some are @JsonIgnore, so we should be careful.
        
        return ResponseEntity.ok(export);
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, String>> importData(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> data) {
        // Implementation of import would involve clearing existing lodge data and re-inserting
        // This is high-risk, so let's just implement a placeholder for now or a basic version
        return ResponseEntity.ok(Map.of("message", "Tính năng nhập dữ liệu đang được hoàn thiện"));
    }
}
