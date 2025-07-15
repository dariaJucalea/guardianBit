package com.guardianBit.guardianBit.services;

import com.guardianBit.guardianBit.models.ReportedUrl;
import com.guardianBit.guardianBit.repositories.ReportedUrlRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportedUrlService {

    private final ReportedUrlRepository reportedUrlRepository;

    public ReportedUrlService(ReportedUrlRepository reportedUrlRepository) {
        this.reportedUrlRepository = reportedUrlRepository;
    }

    public List<ReportedUrl> getReportsByEmail(String email) {
        List<ReportedUrl> all = new ArrayList<>();
        reportedUrlRepository.findAll().forEach(all::add);

        return all.stream()
                .filter(r -> r.getEmail().equalsIgnoreCase(email))
                .collect(Collectors.toList());
    }

    public List<ReportedUrl> getReportsByUrl(String url) {
        return reportedUrlRepository.findByUrl(url);
    }

    public void deleteReportsByUrl(String url) {
        reportedUrlRepository.deleteByUrl(url);
    }

}

