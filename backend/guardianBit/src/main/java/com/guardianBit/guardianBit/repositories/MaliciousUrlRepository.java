package com.guardianBit.guardianBit.repositories;

import com.guardianBit.guardianBit.models.MaliciousUrl;
import org.springframework.data.repository.CrudRepository;
import java.util.Optional;

public interface MaliciousUrlRepository extends CrudRepository<MaliciousUrl, String> {
    Optional<MaliciousUrl> findByUrl(String url);
}
