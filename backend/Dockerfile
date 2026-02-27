FROM php:8.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    curl \
    libzip-dev \
    git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Enable Apache mod_rewrite, mod_headers, and ensure only mpm_prefork is enabled
RUN a2dismod mpm_event mpm_worker || true
RUN a2enmod mpm_prefork rewrite headers

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for caching
COPY composer.json composer.lock ./

# Install dependencies (no dev dependencies in production)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy application code
COPY . .

# Run post-install scripts after copying all code
RUN composer dump-autoload --optimize

# Create necessary directories and set permissions
RUN mkdir -p storage/framework/{cache,sessions,views} \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Create the storage symlink
RUN php artisan storage:link || true

# Configure Apache DocumentRoot to point to public folder
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Configure Apache to listen on PORT from Railway (default 80)
RUN echo 'PassEnv PORT' >> /etc/apache2/apache2.conf

# Create entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
