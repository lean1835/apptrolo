package com.apptrololo.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double price;

    @Column(length = 20)
    private String status; // occupied, empty, maintenance, debt

    private String tenant;

    private String phone;

    private LocalDate checkin;

    private Integer people;

    private Double ep; // previous electricity

    private Double wp; // previous water

    @Column(columnDefinition = "TEXT")
    private String descText; // changed from desc to descText because desc is a reserved word in SQL

    @Column(length = 20)
    private String contract; // monthly, quarter, halfyear

    private Integer contractMonths;

    private Integer contractPrepaid;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "lodge_id")
    private Lodge lodge;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    private List<Member> members;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    private List<MeterReading> meterReadings;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    private List<Bill> bills;
}
