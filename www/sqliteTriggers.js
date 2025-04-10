cordova.define('cordova-sqlite-triggers.SQLiteTriggers', function (require, exports, module) {
  module.exports = {
    /**
     * Updates session values in app_state by converting empty session objects to null.
     * This function opens the database, starts a transaction, and performs the necessary updates.
     * @param {function} successCallback - Callback function to execute after updates.
     */
    updateAppState: function (successCallback) {
      console.log('[SQLiteTriggers] Starting session update process...');

      if (!window.sqlitePlugin) {
        console.error('[SQLiteTriggers] SQLite plugin not available');
        successCallback?.();
        return;
      }

      const db = window.sqlitePlugin.openDatabase({
        name: '_planonMobileAppDB',
        location: 'default',
      });

      db.transaction(
        function (tx) {
          tx.executeSql(
            "SELECT id, json_extract(value, '$.session') AS sessionVal FROM app_state;",
            [],
            function (tx, result) {
              for (let i = 0; i < result.rows.length; i++) {
                const row = result.rows.item(i);
                if (row.sessionVal === '{}') {
                  tx.executeSql(
                    "UPDATE app_state SET value = json_set(value, '$.session', null) WHERE id = ?;",
                    [row.id],
                    function () {
                      console.log(`[SQLiteTriggers] Updated record id ${row.id}`);
                    },
                    function (tx, error) {
                      console.error(`[SQLiteTriggers] Failed updating record id ${row.id}:`, error);
                    }
                  );
                }
              }
              console.log('[SQLiteTriggers] Session update process completed.');
              successCallback?.();
            },
            function (tx, error) {
              console.error('[SQLiteTriggers] Error querying app_state:', error);
              successCallback?.();
            }
          );
        },
        function (error) {
          console.error('[SQLiteTriggers] Transaction error:', error);
          successCallback?.();
        },
        function () {
          console.log('[SQLiteTriggers] Transaction completed.');
        }
      );
    },
  };
});
