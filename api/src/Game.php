<?php
declare(strict_types=1);

namespace Minesweeper;

class Game
{
    private const MINE = -1;
    private const DIRECTIONS = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
    ];

    public static function generate(int $rows, int $cols, int $mines, int $firstRow, int $firstCol): array
    {
        $board = array_fill(0, $rows, array_fill(0, $cols, 0));

        $safeZone = self::getSafeZone($firstRow, $firstCol, $rows, $cols);

        $placed = 0;
        while ($placed < $mines) {
            $r = random_int(0, $rows - 1);
            $c = random_int(0, $cols - 1);

            if ($board[$r][$c] === self::MINE || isset($safeZone["$r,$c"])) {
                continue;
            }

            $board[$r][$c] = self::MINE;
            $placed++;
        }

        for ($r = 0; $r < $rows; $r++) {
            for ($c = 0; $c < $cols; $c++) {
                if ($board[$r][$c] === self::MINE) {
                    continue;
                }
                $count = 0;
                foreach (self::DIRECTIONS as [$dr, $dc]) {
                    $nr = $r + $dr;
                    $nc = $c + $dc;
                    if ($nr >= 0 && $nr < $rows && $nc >= 0 && $nc < $cols && $board[$nr][$nc] === self::MINE) {
                        $count++;
                    }
                }
                $board[$r][$c] = $count;
            }
        }

        return $board;
    }

    private static function getSafeZone(int $row, int $col, int $rows, int $cols): array
    {
        $zone = ["$row,$col" => true];
        foreach (self::DIRECTIONS as [$dr, $dc]) {
            $nr = $row + $dr;
            $nc = $col + $dc;
            if ($nr >= 0 && $nr < $rows && $nc >= 0 && $nc < $cols) {
                $zone["$nr,$nc"] = true;
            }
        }
        return $zone;
    }
}
