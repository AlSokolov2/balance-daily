<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class SendTestPush extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'send:test-push {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test Web Push notification to a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $query = User::query();
        
        if ($email) {
            $query->where('email', $email);
        }

        $users = $query->with('pushSubscriptions')->get();

        if ($users->isEmpty()) {
            $this->error('No users found.');
            return;
        }

        $publicKey = config('services.webpush.public_key');
        $privateKey = config('services.webpush.private_key');

        if (!$publicKey || !$privateKey) {
            $this->error('VAPID keys not configured in services.php / .env');
            return;
        }

        $auth = [
            'VAPID' => [
                'subject' => config('app.url'),
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
            ],
        ];

        $webPush = new WebPush($auth);
        $payload = json_encode([
            'title' => 'Balance.Daily',
            'body' => 'Это тестовое уведомление! Система пушей работает.',
            'icon' => '/favicon.svg',
        ]);

        $sentCount = 0;
        foreach ($users as $user) {
            foreach ($user->pushSubscriptions as $sub) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->public_key,
                        'authToken' => $sub->auth_token,
                    ]),
                    $payload
                );
                $sentCount++;
            }
        }

        $this->info("Sending {$sentCount} notifications...");
        
        foreach ($webPush->flush() as $report) {
            $endpoint = $report->getEndpoint();
            if ($report->isSuccess()) {
                $this->line("✅ Success: {$endpoint}");
            } else {
                $this->error("❌ Failed: {$endpoint}. Reason: {$report->getReason()}");
            }
        }
    }
}
