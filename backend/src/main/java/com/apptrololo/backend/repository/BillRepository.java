package com.apptrololo.backend.repository;

import com.apptrololo.backend.entity.Bill;
import com.apptrololo.backend.entity.Lodge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {
    @Query("SELECT b FROM Bill b WHERE b.room.lodge = :lodge")
    List<Bill> findAllByLodge(@Param("lodge") Lodge lodge);
}
