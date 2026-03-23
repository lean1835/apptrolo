package com.apptrololo.backend.security;

import com.apptrololo.backend.dto.AuthenticationRequest;
import com.apptrololo.backend.dto.AuthenticationResponse;
import com.apptrololo.backend.dto.RegisterRequest;
import com.apptrololo.backend.entity.Lodge;
import com.apptrololo.backend.entity.User;
import com.apptrololo.backend.entity.UtilityPrice;
import com.apptrololo.backend.repository.UserRepository;
import com.apptrololo.backend.repository.LodgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository repository;
    private final LodgeRepository lodgeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {
        var user = User.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        
        user = repository.save(user); // Persistence first

        Lodge lodge = Lodge.builder()
                .name(request.getLodgeName())
                .address(request.getLodgeAddress())
                .phone(request.getPhone())
                .owner(user)
                .build();

        UtilityPrice utilityPrice = UtilityPrice.builder()
                .elec(3500.0)
                .water(15000.0)
                .wifi(100000.0)
                .garbage(20000.0)
                .waterMode("meter")
                .waterFixed(150000.0)
                .lodge(lodge)
                .build();

        lodge.setUtilityPrice(utilityPrice);
        
        lodge = lodgeRepository.save(lodge);
        
        user.setLodge(lodge);
        
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .name(user.getName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getPhone(),
                        request.getPassword()
                )
        );
        var user = repository.findByPhone(request.getPhone())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .name(user.getName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .build();
    }
}
