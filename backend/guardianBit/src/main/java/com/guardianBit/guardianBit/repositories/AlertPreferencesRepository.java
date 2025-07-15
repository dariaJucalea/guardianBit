// AlertPreferencesRepository.java
package com.guardianBit.guardianBit.repositories;

import com.guardianBit.guardianBit.models.AlertPreferences;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AlertPreferencesRepository extends MongoRepository<AlertPreferences, String> {
    Optional<AlertPreferences> findByUserId(String userId);

    boolean existsByUserId(String userId);

    void deleteByUserId(String userId);
}