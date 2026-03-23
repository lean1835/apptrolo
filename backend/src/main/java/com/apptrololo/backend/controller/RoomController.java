package com.apptrololo.backend.controller;

import com.apptrololo.backend.entity.*;
import com.apptrololo.backend.repository.UserRepository;
import com.apptrololo.backend.service.ActivityService;
import com.apptrololo.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Slf4j
public class RoomController {

    private final RoomService roomService;
    private final UserRepository userRepository;
    private final ActivityService activityService;

    @GetMapping
    public ResponseEntity<List<Room>> getRooms(@AuthenticationPrincipal User user) {
        User fullUser = userRepository.findByPhone(user.getPhone()).orElse(user);
        return ResponseEntity.ok(roomService.getRoomsByLodge(fullUser.getLodge()));
    }

    @PostMapping
    public ResponseEntity<Room> createRoom(@AuthenticationPrincipal User user, @RequestBody Room roomRequest) {
        User fullUser = userRepository.findByPhone(user.getPhone()).orElse(user);
        if (fullUser.getLodge() == null) {
            log.error("Lodge not found for user: {}", user.getPhone());
            return ResponseEntity.badRequest().build();
        }
        roomRequest.setLodge(fullUser.getLodge());
        return ResponseEntity.ok(roomService.saveRoom(roomRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoom(@PathVariable Long id) {
        Room room = roomService.getRoomById(id);
        if (room == null) {
            log.warn("Room NOT found for ID: {}", id);
            return ResponseEntity.notFound().build();
        }
        log.info("Fetching room {}: {}", id, room.getName());
        return ResponseEntity.ok(room);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Room> updateRoom(@PathVariable Long id, @RequestBody Room roomRequest) {
        log.info("Updating room {}: status={}, tenant={}, phone={}", id, roomRequest.getStatus(), roomRequest.getTenant(), roomRequest.getPhone());
        Room room = roomService.getRoomById(id);
        
        String oldTenant = room.getTenant() == null ? "" : room.getTenant().trim();
        String newTenant = roomRequest.getTenant() == null ? "" : roomRequest.getTenant().trim();
        
        if (!newTenant.isEmpty() && !newTenant.equals(oldTenant)) {
            if (room.getLodge() != null) {
                activityService.logActivityByLodge(room.getLodge().getId(),
                        room.getName() + " · Khách mới: " + newTenant, "member");
            }
        }

        room.setName(roomRequest.getName());
        room.setPrice(roomRequest.getPrice());
        room.setStatus(roomRequest.getStatus());
        room.setDescText(roomRequest.getDescText());
        room.setTenant(roomRequest.getTenant());
        room.setPhone(roomRequest.getPhone());
        room.setPeople(roomRequest.getPeople());
        room.setCheckin(roomRequest.getCheckin());
        room.setContract(roomRequest.getContract());
        room.setContractPrepaid(roomRequest.getContractPrepaid());
        room.setEp(roomRequest.getEp());
        room.setWp(roomRequest.getWp());
        return ResponseEntity.ok(roomService.saveRoom(room));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<Member> addMember(@PathVariable Long id, @RequestBody Member member) {
        return ResponseEntity.ok(roomService.addMember(id, member));
    }

    @DeleteMapping("/members/{memberId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long memberId) {
        roomService.removeMember(memberId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/meter-readings")
    public ResponseEntity<MeterReading> addMeterReading(@PathVariable Long id, @RequestBody MeterReading reading) {
        return ResponseEntity.ok(roomService.addMeterReading(id, reading));
    }

    @PostMapping("/{id}/bills")
    public ResponseEntity<Bill> createBill(@PathVariable Long id, @RequestBody Bill bill) {
        return ResponseEntity.ok(roomService.createBill(id, bill));
    }
}
