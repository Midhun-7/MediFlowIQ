package com.mediflowiq.repository;

import com.mediflowiq.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    List<Hospital> findByActiveTrue();

    /** Used for load-balancing: find active hospitals with load below a given percentage */
    List<Hospital> findByActiveTrueOrderByCurrentLoadAsc();
}
