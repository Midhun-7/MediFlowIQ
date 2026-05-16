package com.mediflowiq.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the Jackson Hibernate6 module so that Hibernate lazy-loading
 * proxies (ByteBuddyInterceptor) are handled gracefully during JSON serialization.
 *
 * Without this, any endpoint returning an entity with LAZY relationships
 * throws: "Type definition error: [simple type, class ByteBuddyInterceptor]"
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        // Serialize uninitialized lazy proxies as null instead of throwing
        module.disable(Hibernate6Module.Feature.USE_TRANSIENT_ANNOTATION);
        module.enable(Hibernate6Module.Feature.SERIALIZE_IDENTIFIER_FOR_LAZY_NOT_LOADED_OBJECTS);
        return module;
    }
}
