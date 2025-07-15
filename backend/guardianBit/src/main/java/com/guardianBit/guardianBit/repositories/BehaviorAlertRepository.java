// BehaviorAlertRepository.java
package com.guardianBit.guardianBit.repositories;

import com.guardianBit.guardianBit.models.BehaviorAlert;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface BehaviorAlertRepository extends MongoRepository<BehaviorAlert, String> {
    List<BehaviorAlert> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<BehaviorAlert> findByUserIdAndSeverityOrderByCreatedAtDesc(String userId, String severity);

    @Query("{ 'userId': ?0, 'sentAt': null }")
    List<BehaviorAlert> findUnsentAlertsByUserId(String userId);

    @Query("{ 'userId': ?0, 'createdAt': { $gte: ?1 } }")
    List<BehaviorAlert> findRecentAlertsByUserId(String userId, LocalDateTime since);


    @Query("{ 'sentAt': null, 'createdAt': { $gte: ?0 } }")
    List<BehaviorAlert> findPendingEmailAlerts(LocalDateTime since);


    @Query(value = "{ 'createdAt': { $lt: ?0 } }", delete = true)
    void deleteOldAlerts(LocalDateTime before);
}