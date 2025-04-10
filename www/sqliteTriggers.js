cordova.define('cordova-sqlite-triggers.SQLiteTriggers', function (require, exports, module) {
  module.exports = {
    /**
     * Updates session values in app_state if db_version table does not exist.
     * This is done to ensure that any existing empty session objects are converted to null.
     * The db_version table check is used to determine if the app has been initialized properly.
     * If it doesn't exist, we assume the app is in an initial state and perform updates.
     * @param {Transaction} tx - The SQLite transaction object.
     * @param {function} successCallback - Callback function to execute after updates.
     */
    updateSessionIfEmpty: function (tx, successCallback) {
      // Check if the "db_version" table exists
      tx.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='db_version';",
        [],
        function (tx, result) {
          // If db_version table does not exist, result.rows will be empty
          if (result.rows.length === 0) {
            // Query the app_state table for all records and extract the session value
            tx.executeSql(
              "SELECT id, json_extract(value, '$.session') AS sessionVal FROM app_state;",
              [],
              function (tx, result2) {
                var updateCount = 0;
                // Iterate over each record in app_state
                for (var i = 0; i < result2.rows.length; i++) {
                  var row = result2.rows.item(i);
                  // If the session is exactly an empty object string, update it to null
                  if (row.sessionVal === '{}') {
                    tx.executeSql(
                      "UPDATE app_state SET value = json_set(value, '$.session', null) WHERE id = ?;",
                      [row.id],
                      function () {
                        console.log('[SQLiteTriggers] Updated record id ' + row.id);
                        updateCount++;
                      },
                      function (tx, error) {
                        console.error('[SQLiteTriggers] Failed updating record id ' + row.id + ': ', error);
                      }
                    );
                  }
                }
                console.log('[SQLiteTriggers] Updated ' + updateCount + ' record(s).');
                if (successCallback) {
                  successCallback();
                }
              },
              function (tx, error) {
                console.error('[SQLiteTriggers] Error querying app_state: ', error);
              }
            );
          } else {
            console.log('[SQLiteTriggers] db_version table exists; skipping app_state update.');
            if (successCallback) {
              successCallback();
            }
          }
        },
        function (tx, error) {
          console.error('[SQLiteTriggers] Error checking for db_version table: ', error);
        }
      );
    },

    /**
     * Creates triggers to handle empty session objects in app_state.
     * These triggers ensure that any new or updated records with an empty session object are automatically updated to have a null session.
     * @param {Transaction} tx - The SQLite transaction object.
     */
    createTriggers: function (tx) {
      // Helper function to check for a trigger and create it if it doesn't exist
      function checkAndCreateTrigger(triggerType) {
        var triggerName = 'check_empty_session_after_' + triggerType.toLowerCase();
        // Query sqlite_master to see if the trigger exists
        tx.executeSql(
          "SELECT name FROM sqlite_master WHERE type='trigger' AND name=?;",
          [triggerName],
          function (tx, result) {
            if (result.rows.length === 0) {
              // Create the trigger if it doesn't exist
              var triggerSQL = `
                    CREATE TRIGGER check_empty_session_after_%TRIGGER_TYPE%
                    AFTER %TRIGGER_TYPE% ON app_state
                    FOR EACH ROW
                    WHEN json_extract(NEW.value, '$.session') = '{}'
                    BEGIN
                        UPDATE app_state
                        SET value = json_set(NEW.value, '$.session', null)
                        WHERE id = NEW.id;
                    END;`;
              var sql = triggerSQL.replace(/%TRIGGER_TYPE%/g, triggerType).replace(/\n\s+/g, ' '); // minify the SQL if desired

              tx.executeSql(
                sql,
                [],
                function () {
                  console.log('[SQLiteTriggers] ' + triggerType + ' trigger created successfully.');
                },
                function (tx, err) {
                  console.error('[SQLiteTriggers] Error creating ' + triggerType + ' trigger: ', err);
                }
              );
            } else {
              console.log('[SQLiteTriggers] Trigger "' + triggerType + '" already exists; skipping creation.');
            }
          },
          function (tx, err) {
            console.error('[SQLiteTriggers] Error checking trigger for ' + triggerType + ': ', err);
          }
        );
      }
      // For each trigger type, call the helper to check and create if needed
      ['INSERT', 'UPDATE'].forEach(function (triggerType) {
        checkAndCreateTrigger(triggerType);
      });
    },

    /**
     * Updates app_state by converting empty session objects to null and creates triggers.
     * This function ensures that the database is properly set up for handling session data.
     */
    updateAppStateAndCreateTriggers: function () {
      console.log('[SQLiteTriggers] Starting update and trigger creation process...');
      if (window.sqlitePlugin) {
        let db = window.sqlitePlugin.openDatabase({
          name: '_planonMobileAppDB',
          location: 'default',
        });

        db.transaction(function (tx) {
          // First, update app_state if needed
          module.exports.updateSessionIfEmpty(tx, function () {
            // Then, proceed to create the triggers
            module.exports.createTriggers(tx);
          });
        });
      } else {
        console.error('[SQLiteTriggers] SQLite plugin not available');
      }
    },
  };
});
