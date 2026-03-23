package com.apptrololo.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "lodges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lodge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String address;

    @Column(nullable = false)
    private String phone;

    private String bank;

    private String bankName;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    @OneToMany(mappedBy = "lodge", cascade = CascadeType.ALL)
    private List<Room> rooms;

    @OneToOne(mappedBy = "lodge", cascade = CascadeType.ALL)
    private UtilityPrice utilityPrice;
}
