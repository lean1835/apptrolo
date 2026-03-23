package com.apptrololo.backend.service;

import com.apptrololo.backend.entity.Lodge;
import com.apptrololo.backend.entity.User;
import com.apptrololo.backend.repository.LodgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LodgeService {

    private final LodgeRepository lodgeRepository;

    public Optional<Lodge> getLodgeByOwner(User owner) {
        return lodgeRepository.findByOwner(owner);
    }

    public Lodge saveLodge(Lodge lodge) {
        Lodge saved = lodgeRepository.save(lodge);
        return saved;
    }
}
