package com.apptrololo.backend.service;

import com.apptrololo.backend.entity.*;
import com.apptrololo.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final MemberRepository memberRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final BillRepository billRepository;
    private final ActivityService activityService;

    public List<Room> getRoomsByLodge(Lodge lodge) {
        return roomRepository.findByLodge(lodge);
    }

    public Room saveRoom(Room room) {
        boolean isNew = (room.getId() == null);
        Room saved = roomRepository.save(room);
        
        if (isNew && saved.getLodge() != null) {
            activityService.logActivityByLodge(saved.getLodge().getId(),
                "Tạo phòng mới: " + saved.getName(), "room");
        }
        
        return saved;
    }

    public void deleteRoom(Long id) {
        if (id != null) {
            Room room = roomRepository.findById(id).orElse(null);
            if (room != null) {
                if (room.getLodge() != null) {
                    activityService.logActivityByLodge(room.getLodge().getId(),
                        "Xóa phòng: " + room.getName(), "room");
                }
                roomRepository.deleteById(id);
            }
        }
    }

    public Room getRoomById(Long id) {
        if (id == null) return null;
        return roomRepository.findById(id).orElse(null);
    }

    public Member addMember(Long roomId, Member member) {
        Room room = getRoomById(roomId);
        if (room == null) return null;
        member.setRoom(room);
        
        // Auto-increment people count
        int currentPeople = room.getPeople() != null ? room.getPeople() : 1;
        room.setPeople(currentPeople + 1);
        roomRepository.save(room);
        
        Member saved = memberRepository.save(member);
        if (room.getLodge() != null) {
            activityService.logActivityByLodge(room.getLodge().getId(), 
                room.getName() + " · Thêm thành viên: " + member.getName(), "member");
        }
        return saved;
    }

    public void removeMember(Long memberId) {
        Member member = memberRepository.findById(memberId).orElse(null);
        if (member != null) {
            Room room = member.getRoom();
            memberRepository.delete(member);
            
            if (room != null) {
                // Auto-decrement people count, minimum is 1 (the tenant)
                int currentPeople = room.getPeople() != null ? room.getPeople() : 1;
                room.setPeople(Math.max(1, currentPeople - 1));
                roomRepository.save(room);
            }
        }
    }

    public MeterReading addMeterReading(Long roomId, MeterReading reading) {
        Room room = getRoomById(roomId);
        if (room == null) return null;
        reading.setRoom(room);
        
        MeterReading saved = meterReadingRepository.save(reading);
        
        // Update the in-memory collection to reflect the change immediately
        if (room.getMeterReadings() != null) {
            room.getMeterReadings().add(saved);
        }
        if (room.getLodge() != null) {
            activityService.logActivityByLodge(room.getLodge().getId(), 
                room.getName() + " · Đã ghi điện nước", "meter");
        }
        return saved;
    }

    public Bill createBill(Long roomId, Bill bill) {
        Room room = getRoomById(roomId);
        if (room == null) return null;
        bill.setRoom(room);
        Bill saved = billRepository.save(bill);
        
        if (room.getLodge() != null) {
            String actionVerb = "Gửi hóa đơn ";
            if (Boolean.TRUE.equals(bill.getCollected())) {
                actionVerb = "Đã thu tiền ";
            } else if (Boolean.FALSE.equals(bill.getSent()) || bill.getSent() == null) {
                actionVerb = "Lưu nháp hóa đơn ";
            }
            String act = actionVerb + String.format("%,d", bill.getTotal() != null ? bill.getTotal().longValue() : 0).replace(",", ".") + " đ";
            activityService.logActivityByLodge(room.getLodge().getId(), 
                room.getName() + " · " + act, "bill");
        }
        return saved;
    }
}
