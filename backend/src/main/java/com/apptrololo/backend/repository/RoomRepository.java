package com.apptrololo.backend.repository;

import com.apptrololo.backend.entity.Lodge;
import com.apptrololo.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByLodge(Lodge lodge);
}
