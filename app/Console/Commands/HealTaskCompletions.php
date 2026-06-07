<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Models\TaskCompletion;
use Carbon\Carbon;
use Illuminate\Console\Command;

class HealTaskCompletions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:heal-task-completions {--dry-run : Perform a dry run without saving changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate completion history from encrypted task notes to structured task_completions table and clean up notes.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $tasks = Task::all();
        $totalMigrated = 0;
        $totalCleaned = 0;

        $this->info('Starting data healing process...'.($dryRun ? ' [DRY RUN]' : ''));

        foreach ($tasks as $task) {
            $notes = (string) $task->notes;
            if (empty($notes)) {
                continue;
            }

            // Pattern for completion marks
            $pattern = '/✔\s*(\d{1,2}[\.\/]\d{1,2}(?:[\.\/]\d{2,4})?.*)(?:\n|$)/u';

            if (preg_match_all($pattern, $notes, $matches)) {
                $foundCompletions = $matches[1];
                $newNotes = (string) preg_replace($pattern, '', $notes);
                $newNotes = trim($newNotes);

                $this->line("Task #{$task->id}: Found ".count($foundCompletions).' completion(s).');

                foreach ($foundCompletions as $dateStr) {
                    try {
                        $cleanDateStr = trim((string) $dateStr);
                        $cleanDateStr = str_replace(['at', 'в', 'г.'], '', $cleanDateStr);

                        if (preg_match('/^(\d{1,2})[\.\/](\d{1,2})(?![\.\/]\d{2,4})/', $cleanDateStr, $dateMatches)) {
                            $day = $dateMatches[1];
                            $month = $dateMatches[2];
                            $year = date('Y');
                            $rest = substr($cleanDateStr, strlen($dateMatches[0]));
                            $cleanDateStr = "{$day}.{$month}.{$year}{$rest}";
                        }

                        $cleanDateStr = str_replace(',', ' ', $cleanDateStr);
                        $completedAt = Carbon::parse($cleanDateStr);

                        if (! $dryRun) {
                            $exists = TaskCompletion::where('task_id', $task->id)
                                ->where('completed_at', $completedAt)
                                ->exists();

                            if (! $exists) {
                                TaskCompletion::create([
                                    'task_id' => $task->id,
                                    'user_id' => $task->user_id,
                                    'completed_at' => $completedAt,
                                ]);
                                $totalMigrated++;
                            }
                        } else {
                            $totalMigrated++;
                        }
                    } catch (\Exception $e) {
                        $this->error("  Could not parse date: '{$dateStr}' for Task #{$task->id}. Error: {$e->getMessage()}");
                    }
                }

                if (! $dryRun) {
                    if ($newNotes !== (string) $task->notes) {
                        if (! str_contains($newNotes, 'История выполнений перенесена')) {
                            $infoMsg = "--- \nℹ История выполнений перенесена в раздел статистики.";
                            $newNotes = $newNotes ? $newNotes."\n\n".$infoMsg : $infoMsg;
                        }
                        $task->notes = $newNotes;
                        $task->save();
                        $totalCleaned++;
                    }
                } else {
                    $totalCleaned++;
                }
            }
        }

        $this->info('---');
        $this->info('Healing complete!');
        $this->info("Total completions migrated/found: {$totalMigrated}");
        $this->info("Total tasks cleaned: {$totalCleaned}");

        return 0;
    }
}
