package com.apptrololo.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "utility_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtilityPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double elec;

    private Double water;

    private Double wifi;

    private Double garbage;

    @Column(length = 20)
    private String waterMode; // "meter" or "fixed"

    private Double waterFixed;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "lodge_id")
    private Lodge lodge;
}
