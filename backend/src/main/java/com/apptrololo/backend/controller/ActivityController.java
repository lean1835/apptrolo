package com.apptrololo.backend.controller;

import com.apptrololo.backend.entity.Activity;
import com.apptrololo.backend.entity.User;
import com.apptrololo.backend.repository.ActivityRepository;
import com.apptrololo.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {
    
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Activity>> getRecent(@AuthenticationPrincipal User authUser) {
        User user = userRepository.findByPhone(authUser.getPhone()).orElse(null);
        if (user == null) return ResponseEntity.badRequest().build();
        List<Activity> acts = activityRepository.findTop10ByUserOrderByTimeDesc(user);
        System.out.println("FETCHED ACTIVITIES for " + user.getPhone() + " : " + acts.size());
        return ResponseEntity.ok(acts);
    }
}
