<?php
declare(strict_types=1);

require_once __DIR__ . '/src/Game.php';
require_once __DIR__ . '/src/Board.php';

use Minesweeper\Board;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

try {
    $board = new Board(
        (int)($input['rows'] ?? 0),
        (int)($input['cols'] ?? 0),
        (int)($input['mines'] ?? 0),
        (int)($input['firstClick']['row'] ?? -1),
        (int)($input['firstClick']['col'] ?? -1),
    );

    echo json_encode(['board' => $board->generate()]);
} catch (\InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
