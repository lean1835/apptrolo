package com.apptrololo.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20)
    private String type; // debt, reminder, info

    @Column(nullable = false)
    private String msg;

    @Column(nullable = false)
    private LocalDateTime time;

    private Boolean isRead;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
