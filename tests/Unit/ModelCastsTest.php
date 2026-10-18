<?php

namespace Tests\Unit;

use App\Models\SubcatCoeff;
use App\Models\Task;
use PHPUnit\Framework\TestCase;

class ModelCastsTest extends TestCase
{
    /**
     * MySQL returns DECIMAL columns as strings ("2.0", "1.5000"). Without a cast
     * the select in the task form cannot match its option values (#198).
     */
    public function test_importance_is_cast_to_float(): void
    {
        $task = new Task(['importance' => '2.0']);

        $this->assertSame(2.0, $task->importance);
    }

    public function test_subcategory_coefficient_is_cast_to_float(): void
    {
        $coeff = new SubcatCoeff(['coefficient' => '1.5000']);

        $this->assertSame(1.5, $coeff->coefficient);
    }
}
