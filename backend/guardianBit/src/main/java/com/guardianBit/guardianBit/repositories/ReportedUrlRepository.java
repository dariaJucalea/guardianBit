package com.guardianBit.guardianBit.repositories;

import com.guardianBit.guardianBit.models.ReportedUrl;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface ReportedUrlRepository extends CrudRepository<ReportedUrl, String> {
    List<ReportedUrl> findByEmail(String email);

    List<ReportedUrl> findByUrl(String url);
    void deleteByUrl(String url);

}
