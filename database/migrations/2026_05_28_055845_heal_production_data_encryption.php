<?php

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // We use a transaction to ensure data integrity
        DB::transaction(function () {

            // 1. Categories
            foreach (DB::table('categories')->get() as $row) {
                if ($row->name && ! $this->isEncrypted($row->name)) {
                    DB::table('categories')->where('id', $row->id)->update([
                        'name' => Crypt::encryptString($row->name),
                    ]);
                }
            }

            // 2. Tasks
            foreach (DB::table('tasks')->get() as $row) {
                $updates = [];
                if ($row->title && ! $this->isEncrypted($row->title)) {
                    $updates['title'] = Crypt::encryptString($row->title);
                }
                if ($row->notes && ! $this->isEncrypted($row->notes)) {
                    $updates['notes'] = Crypt::encryptString($row->notes);
                }
                if ($row->subcategory && ! $this->isEncrypted($row->subcategory)) {
                    $updates['subcategory'] = Crypt::encryptString($row->subcategory);
                }

                if (! empty($updates)) {
                    DB::table('tasks')->where('id', $row->id)->update($updates);
                }
            }

            // 3. Settings
            foreach (DB::table('settings')->get() as $row) {
                if ($row->value && ! $this->isEncrypted($row->value)) {
                    DB::table('settings')->where('id', $row->id)->update([
                        'value' => Crypt::encryptString($row->value),
                    ]);
                }
            }

            // 4. Users
            foreach (DB::table('users')->get() as $row) {
                $updates = [];
                if ($row->google_token && ! $this->isEncrypted($row->google_token)) {
                    $updates['google_token'] = Crypt::encryptString($row->google_token);
                }
                if ($row->google_refresh_token && ! $this->isEncrypted($row->google_refresh_token)) {
                    $updates['google_refresh_token'] = Crypt::encryptString($row->google_refresh_token);
                }

                if (! empty($updates)) {
                    DB::table('users')->where('id', $row->id)->update($updates);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     * Note: Decrypting back is dangerous if the keys are different, but we try our best.
     */
    public function down(): void
    {
        // Usually, we don't want to decrypt back in a hotfix unless absolutely necessary,
        // because we might not have the correct keys if someone changed them.
    }

    /**
     * Check if a string is already encrypted.
     * Laravel's encryption results in a base64 encoded JSON string starting with {"iv":...
     */
    private function isEncrypted($value): bool
    {
        if (str_contains($value, 'eyJpdiI6')) {
            try {
                Crypt::decryptString($value);

                return true;
            } catch (DecryptException $e) {
                // It looks like encryption but fails to decrypt (wrong key?)
                // In this case, we treat it as "broken/encrypted" but don't re-encrypt.
                return true;
            }
        }

        return false;
    }
};
