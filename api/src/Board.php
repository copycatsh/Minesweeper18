<?php
declare(strict_types=1);

namespace Minesweeper;

class Board
{
    public readonly int $rows;
    public readonly int $cols;
    public readonly int $mines;
    public readonly int $firstRow;
    public readonly int $firstCol;

    private const LIMITS = [
        'rows' => ['min' => 5, 'max' => 30],
        'cols' => ['min' => 5, 'max' => 50],
    ];

    public function __construct(int $rows, int $cols, int $mines, int $firstRow, int $firstCol)
    {
        $this->validate($rows, $cols, $mines, $firstRow, $firstCol);
        $this->rows = $rows;
        $this->cols = $cols;
        $this->mines = $mines;
        $this->firstRow = $firstRow;
        $this->firstCol = $firstCol;
    }

    public function generate(): array
    {
        return Game::generate($this->rows, $this->cols, $this->mines, $this->firstRow, $this->firstCol);
    }

    private function validate(int $rows, int $cols, int $mines, int $firstRow, int $firstCol): void
    {
        if ($rows < self::LIMITS['rows']['min'] || $rows > self::LIMITS['rows']['max']) {
            throw new \InvalidArgumentException("rows must be between 5 and 30");
        }
        if ($cols < self::LIMITS['cols']['min'] || $cols > self::LIMITS['cols']['max']) {
            throw new \InvalidArgumentException("cols must be between 5 and 50");
        }
        $maxMines = ($rows * $cols) - 9;
        if ($mines < 1 || $mines > $maxMines) {
            throw new \InvalidArgumentException("mines must be between 1 and $maxMines");
        }
        if ($firstRow < 0 || $firstRow >= $rows || $firstCol < 0 || $firstCol >= $cols) {
            throw new \InvalidArgumentException("firstClick out of bounds");
        }
    }
}
