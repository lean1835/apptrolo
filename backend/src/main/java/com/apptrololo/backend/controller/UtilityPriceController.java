package com.apptrololo.backend.controller;

import com.apptrololo.backend.entity.User;
import com.apptrololo.backend.entity.UtilityPrice;
import com.apptrololo.backend.repository.LodgeRepository;
import com.apptrololo.backend.repository.UtilityPriceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/utility-prices")
@RequiredArgsConstructor
public class UtilityPriceController {

    private final UtilityPriceRepository utilityPriceRepository;

    @GetMapping
    public ResponseEntity<UtilityPrice> getUtilityPrice(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(user.getLodge().getUtilityPrice());
    }

    @PutMapping
    public ResponseEntity<UtilityPrice> updateUtilityPrice(@AuthenticationPrincipal User user, @RequestBody UtilityPrice utilityPriceRequest) {
        UtilityPrice utilityPrice = user.getLodge().getUtilityPrice();
        utilityPrice.setElec(utilityPriceRequest.getElec());
        utilityPrice.setWater(utilityPriceRequest.getWater());
        utilityPrice.setWifi(utilityPriceRequest.getWifi());
        utilityPrice.setGarbage(utilityPriceRequest.getGarbage());
        utilityPrice.setWaterMode(utilityPriceRequest.getWaterMode());
        utilityPrice.setWaterFixed(utilityPriceRequest.getWaterFixed());
        return ResponseEntity.ok(utilityPriceRepository.save(utilityPrice));
    }
}
