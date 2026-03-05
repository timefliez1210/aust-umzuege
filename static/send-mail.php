<?php
/**
 * Form handler for Aust Umzüge contact forms.
 * Uses PHP mail() function (configured by KAS hosting).
 */

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Honeypot spam check
if (!empty($_POST['bot-field'])) {
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
    exit;
}

// Sanitize helper
function clean(string $input): string {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

$formName = $_POST['form-name'] ?? '';
$to = 'angebot@aust-umzuege.de';

if ($formName === 'kontakt') {
    // Simple contact form
    $anrede = clean($_POST['anrede'] ?? '');
    $vorname = clean($_POST['vorname'] ?? '');
    $nachname = clean($_POST['nachname'] ?? '');
    $name = $nachname ? trim("$vorname $nachname") : clean($_POST['name'] ?? '');
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $phone = clean($_POST['phone'] ?? '');
    $message = clean($_POST['nachricht'] ?? '');

    $subject = "Neue Kontaktanfrage von $name";
    $body = "=== Neue Kontaktanfrage ===\n\n";
    if ($anrede) $body .= "Anrede: $anrede\n";
    if ($vorname) $body .= "Vorname: $vorname\n";
    $body .= "Nachname: $name\n";
    $body .= "E-Mail: $email\n";
    $body .= "Telefon: $phone\n\n";
    $body .= "Nachricht:\n$message\n";

} elseif ($formName === 'kostenloses-angebot') {
    // Quote request form
    $anrede = clean($_POST['anrede'] ?? '');
    $vorname = clean($_POST['vorname'] ?? '');
    $nachname = clean($_POST['nachname'] ?? '');
    $name = $nachname ? trim("$vorname $nachname") : clean($_POST['name'] ?? '');
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $phone = clean($_POST['phone'] ?? '');
    $date = clean($_POST['wunschtermin'] ?? '');
    $startAddress = clean($_POST['auszugsadresse'] ?? '');
    $startFloor = clean($_POST['etage-auszug'] ?? '');
    $halteverbotAuszug = isset($_POST['halteverbot-auszug']) ? 'Ja' : 'Nein';
    $zwischenstoppAddress = clean($_POST['zwischenstopp-adresse'] ?? '');
    $zwischenstoppFloor = clean($_POST['etage-zwischenstopp'] ?? '');
    $halteverbotZwischenstopp = isset($_POST['halteverbot-zwischenstopp']) ? 'Ja' : 'Nein';
    $endAddress = clean($_POST['einzugsadresse'] ?? '');
    $endFloor = clean($_POST['etage-einzug'] ?? '');
    $halteverbotEinzug = isset($_POST['halteverbot-einzug']) ? 'Ja' : 'Nein';
    $volume = clean($_POST['umzugsvolumen-m3'] ?? '');
    $items = clean($_POST['gegenstaende-liste'] ?? '');
    $services = clean($_POST['zusatzleistungen'] ?? '');
    $message = clean($_POST['nachricht'] ?? '');

    $subject = "Neues Angebotsanfrage von $name";
    $body = "=== Neue Angebotsanfrage ===\n\n";
    $body .= "--- Kontaktdaten ---\n";
    if ($anrede) $body .= "Anrede: $anrede\n";
    if ($vorname) $body .= "Vorname: $vorname\n";
    $body .= "Nachname: $name\n";
    $body .= "E-Mail: $email\n";
    $body .= "Telefon: $phone\n";
    $body .= "Wunschtermin: $date\n\n";
    $body .= "--- Auszugsadresse ---\n";
    $body .= "Adresse: $startAddress\n";
    $body .= "Etage: $startFloor\n";
    $body .= "Halteverbot: $halteverbotAuszug\n\n";
    if (!empty($zwischenstoppAddress)) {
        $body .= "--- Zwischenstopp ---\n";
        $body .= "Adresse: $zwischenstoppAddress\n";
        $body .= "Etage: $zwischenstoppFloor\n";
        $body .= "Halteverbot: $halteverbotZwischenstopp\n\n";
    }
    $body .= "--- Einzugsadresse ---\n";
    $body .= "Adresse: $endAddress\n";
    $body .= "Etage: $endFloor\n";
    $body .= "Halteverbot: $halteverbotEinzug\n\n";
    $body .= "--- Umzugsdetails ---\n";
    $body .= "Geschätztes Volumen: $volume m³\n";
    $body .= "Gegenstände: $items\n";
    $body .= "Zusatzleistungen: $services\n\n";
    if (!empty($message)) {
        $body .= "--- Nachricht ---\n$message\n";
    }

} elseif ($formName === 'via-termin') {
    // Appointment booking request
    $anrede = clean($_POST['anrede'] ?? '');
    $vorname = clean($_POST['vorname'] ?? '');
    $nachname = clean($_POST['nachname'] ?? '');
    $name = $nachname ? trim("$vorname $nachname") : clean($_POST['name'] ?? '');
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $phone = clean($_POST['phone'] ?? '');
    $date = clean($_POST['wunschtermin'] ?? '');
    $startAddress = clean($_POST['auszugsadresse'] ?? '');
    $endAddress = clean($_POST['einzugsadresse'] ?? '');
    $message = clean($_POST['nachricht'] ?? '');

    $subject = "Terminanfrage Kostenvoranschlag von $name";
    $body = "=== Neue Terminanfrage ===\n\n";
    if ($anrede) $body .= "Anrede: $anrede\n";
    if ($vorname) $body .= "Vorname: $vorname\n";
    $body .= "Nachname: $name\n";
    $body .= "E-Mail: $email\n";
    $body .= "Telefon: $phone\n";
    $body .= "Wunschtermin: $date\n\n";
    if (!empty($startAddress)) {
        $body .= "Auszugsadresse: $startAddress\n";
    }
    if (!empty($endAddress)) {
        $body .= "Einzugsadresse: $endAddress\n";
    }
    if (!empty($message)) {
        $body .= "\nNachricht:\n$message\n";
    }

} elseif ($formName === 'manuell-angebot') {
    // Manual quote request (addresses + services, no photos)
    $anrede = clean($_POST['anrede'] ?? '');
    $vorname = clean($_POST['vorname'] ?? '');
    $nachname = clean($_POST['nachname'] ?? '');
    $name = $nachname ? trim("$vorname $nachname") : clean($_POST['name'] ?? '');
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $phone = clean($_POST['phone'] ?? '');
    $date = clean($_POST['wunschtermin'] ?? '');
    $startAddress = clean($_POST['auszugsadresse'] ?? '');
    $startFloor = clean($_POST['etage_auszug'] ?? '');
    $aufzugAuszug = ($_POST['aufzug_auszug'] ?? '') === 'true' ? 'Ja' : 'Nein';
    $halteverbotAuszug = ($_POST['halteverbot_auszug'] ?? '') === 'true' ? 'Ja' : 'Nein';
    $endAddress = clean($_POST['einzugsadresse'] ?? '');
    $endFloor = clean($_POST['etage_einzug'] ?? '');
    $aufzugEinzug = ($_POST['aufzug_einzug'] ?? '') === 'true' ? 'Ja' : 'Nein';
    $halteverbotEinzug = ($_POST['halteverbot_einzug'] ?? '') === 'true' ? 'Ja' : 'Nein';
    $services = clean($_POST['zusatzleistungen'] ?? '');
    $message = clean($_POST['nachricht'] ?? '');

    $subject = "Manuelle Angebotsanfrage von $name";
    $body = "=== Neue Angebotsanfrage (manuell) ===\n\n";
    $body .= "--- Kontaktdaten ---\n";
    if ($anrede) $body .= "Anrede: $anrede\n";
    if ($vorname) $body .= "Vorname: $vorname\n";
    $body .= "Nachname: $name\n";
    $body .= "E-Mail: $email\n";
    $body .= "Telefon: $phone\n";
    $body .= "Wunschtermin: $date\n\n";
    $body .= "--- Auszugsadresse ---\n";
    $body .= "Adresse: $startAddress\n";
    $body .= "Etage: $startFloor\n";
    $body .= "Aufzug: $aufzugAuszug\n";
    $body .= "Halteverbot: $halteverbotAuszug\n\n";
    $body .= "--- Einzugsadresse ---\n";
    $body .= "Adresse: $endAddress\n";
    $body .= "Etage: $endFloor\n";
    $body .= "Aufzug: $aufzugEinzug\n";
    $body .= "Halteverbot: $halteverbotEinzug\n\n";
    if (!empty($services)) {
        $body .= "Zusatzleistungen: $services\n\n";
    }
    if (!empty($message)) {
        $body .= "--- Nachricht ---\n$message\n";
    }

} else {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Unknown form']);
    exit;
}

// Build JSON attachment from form data
$jsonData = $_POST;
unset($jsonData['bot-field']); // Remove honeypot field
$jsonData['_submitted_at'] = date('c');
$jsonString = json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$jsonBase64 = chunk_split(base64_encode($jsonString));
$jsonFilename = $formName . '-' . date('Y-m-d-His') . '.json';

// Send as multipart MIME with JSON attachment
$boundary = md5(uniqid(time()));

$headers = "From: angebot@aust-umzuege.de\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
$headers .= "X-Mailer: Aust-Umzuege-Website\r\n";

$mimeBody = "--$boundary\r\n";
$mimeBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
$mimeBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$mimeBody .= $body . "\r\n\r\n";
$mimeBody .= "--$boundary\r\n";
$mimeBody .= "Content-Type: application/json; name=\"$jsonFilename\"\r\n";
$mimeBody .= "Content-Transfer-Encoding: base64\r\n";
$mimeBody .= "Content-Disposition: attachment; filename=\"$jsonFilename\"\r\n\r\n";
$mimeBody .= $jsonBase64 . "\r\n";
$mimeBody .= "--$boundary--";

$success = mail($to, $subject, $mimeBody, $headers);

if ($success) {
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Mail could not be sent']);
}
