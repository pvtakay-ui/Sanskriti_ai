<?php
/**
 * SANSKRITI AI - PHP Backend API Handler (XAMPP Native)
 * Provides conversation and system status for Apache/XAMPP hosting.
 */

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($requestMethod === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$action = $_GET['action'] ?? ($requestMethod === 'GET' ? 'health' : 'chat');

if ($action === 'health' || $requestMethod === 'GET') {
    echo json_encode([
        'status' => 'online',
        'owner' => 'Ashmit Kumar',
        'project' => 'Sanskriti AI',
        'phase' => 1,
        'php_version' => phpversion(),
        'server' => 'XAMPP Apache / PHP'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

if ($requestMethod === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $message = isset($data['message']) ? trim($data['message']) : '';
    $lang = isset($data['language']) ? $data['language'] : 'hi-IN';

    $lower = mb_strtolower($message);

    // Multilingual responses matching conversation engine
    if (strpos($lower, 'sat sri akal') !== false || strpos($lower, 'kiddan') !== false || strpos($lower, 'ki haal') !== false) {
        $reply = 'Sat Sri Akal Ashmit ji! Main tuhade naal hamesha tayaar aan. Tuhada din kaisa ja reha hai?';
        $resLang = 'pa-IN';
    } elseif (strpos($lower, 'kasa ahein') !== false || strpos($lower, 'himachal') !== false || strpos($lower, 'pahari') !== false) {
        $reply = 'Namaste Ashmit ji! Himachal diyan shaan te thandak wangu main vi tayaar hoon. Kahiye, ki sewa karaan?';
        $resLang = 'hi-IN';
    } elseif (strpos($lower, 'who are you') !== false || strpos($lower, 'kaun ho') !== false) {
        $reply = 'Main Sanskriti AI hoon — Ashmit Kumar ji ki personal voice-first AI companion aur autonomous assistant!';
        $resLang = 'hi-IN';
    } elseif (strpos($lower, 'hindi') !== false) {
        $reply = 'Namaste Ashmit! Main bilkul Hindi mein baat karungi. Kahiye, main aapki kya madad karoon?';
        $resLang = 'hi-IN';
    } elseif (strpos($lower, 'english') !== false) {
        $reply = 'Hello Ashmit! I have switched to English. How can I help you right now?';
        $resLang = 'en-IN';
    } else {
        $reply = 'Namaste Ashmit! Maine aapki baat dhyan se sun li: "' . htmlspecialchars($message) . '". Phase 1 voice-first system bilkul active hai!';
        $resLang = $lang;
    }

    echo json_encode([
        'reply' => $reply,
        'lang' => $resLang,
        'mood' => 'friendly'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
