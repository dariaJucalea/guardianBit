package com.guardianBit.guardianBit.services;

import com.guardianBit.guardianBit.models.User;
import com.guardianBit.guardianBit.repositories.UserRepository;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean registerUser(String email, String password) {
        if (userRepository.existsByEmail(email)) return false;

        String passwordHash = BCrypt.hashpw(password, BCrypt.gensalt());
        userRepository.save(new User(email, passwordHash));
        return true;
    }

    public boolean authenticate(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt.isPresent() && BCrypt.checkpw(password, userOpt.get().getPasswordHash());
    }
}
