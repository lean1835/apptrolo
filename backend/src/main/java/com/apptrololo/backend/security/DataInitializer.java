package com.apptrololo.backend.security;

import com.apptrololo.backend.dto.RegisterRequest;
import com.apptrololo.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AuthenticationService authenticationService;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        try {
            if (userRepository.findByPhone("0912345678").isEmpty()) {
                RegisterRequest admin = RegisterRequest.builder()
                        .name("Hệ thống (Fix)")
                        .phone("0912345678")
                        .email("admin@apptrololo.com")
                        .password("123456")
                        .lodgeName("Nhà trọ Mẫu")
                        .lodgeAddress("Số 1 Đại Cồ Việt, Hà Nội")
                        .build();
                authenticationService.register(admin);
                System.out.println("✅ Hardcoded user created: 0912345678 / 123456");
            } else {
                System.out.println("ℹ️ Hardcoded user already exists.");
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to create hardcoded user: " + e.getMessage());
        }
    }
}
