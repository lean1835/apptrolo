package com.apptrololo.backend.service;

import com.apptrololo.backend.entity.Activity;
import com.apptrololo.backend.entity.Lodge;
import com.apptrololo.backend.entity.User;
import com.apptrololo.backend.repository.ActivityRepository;
import com.apptrololo.backend.repository.LodgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivityService {
    
    private final ActivityRepository activityRepository;
    private final LodgeRepository lodgeRepository;

    public void logActivityByLodge(Long lodgeId, String txt, String type) {
        if (lodgeId == null) return;
        Lodge lodge = lodgeRepository.findById(lodgeId).orElse(null);
        if (lodge != null && lodge.getOwner() != null) {
            logActivity(lodge.getOwner(), txt, type);
        } else {
            System.out.println("LOG ACTIVITY SKIPPED! Lodge or owner is null for lodgeId=" + lodgeId);
        }
    }

    public void logActivity(User user, String txt, String type) {
        if (user == null) {
            System.out.println("LOG ACTIVITY SKIPPED! user is null. txt=" + txt);
            return;
        }
        System.out.println("LOGGING ACTIVITY: user=" + user.getPhone() + ", txt=" + txt);
        Activity act = Activity.builder()
                .user(user)
                .txt(txt)
                .type(type)
                .time(LocalDateTime.now())
                .build();
        activityRepository.save(act);
    }
}
