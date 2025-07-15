package com.guardianBit.guardianBit.repositories;

import com.guardianBit.guardianBit.models.MaliciousFile;
import org.springframework.data.repository.CrudRepository;
import java.util.Optional;

public interface MaliciousFileRepository extends CrudRepository<MaliciousFile, String> {
    Optional<MaliciousFile> findByFileHash(String fileHash);
}
