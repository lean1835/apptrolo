package com.apptrololo.backend.repository;

import com.apptrololo.backend.entity.Activity;
import com.apptrololo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findTop10ByUserOrderByTimeDesc(User user);
}
