<?php
$ports = [587, 2525, 465];
$host = 'smtp-relay.brevo.com';

foreach ($ports as $port) {
    echo "Testing connection to $host:$port... ";
    $fp = @fsockopen($host, $port, $errno, $errstr, 5);
    if ($fp) {
        echo "SUCCESS\n";
        fclose($fp);
    } else {
        echo "FAIL ($errno: $errstr)\n";
    }
}
