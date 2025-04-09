document.addEventListener(
  'deviceready',
  function () {
    // Automatically execute when Cordova is ready
    if (window.sqlitePlugin) {
      let db = window.sqlitePlugin.openDatabase({
        name: '_planonMobileAppDB',
        location: 'default',
      });

      db.transaction(function (tx) {
        // Drop existing triggers
        ['INSERT', 'UPDATE'].forEach(function (triggerType) {
          tx.executeSql(
            `DROP TRIGGER IF EXISTS check_empty_session_after_${triggerType.toLowerCase()};`,
            [],
            () => console.log(`${triggerType} trigger dropped`),
            (tx, err) => console.error(`Error dropping ${triggerType} trigger:`, err)
          );
        });

        // Create new triggers
        const triggerSQL = `
                CREATE TRIGGER check_empty_session_after_%TRIGGER_TYPE%
                AFTER %TRIGGER_TYPE% ON app_state
                FOR EACH ROW
                WHEN json_extract(NEW.value, '$.session') = '{}'
                BEGIN
                    UPDATE app_state
                    SET value = json_set(NEW.value, '$.session', null)
                    WHERE id = NEW.id;
                END;`;

        ['INSERT', 'UPDATE'].forEach(function (triggerType) {
          const sql = triggerSQL.replace(/%TRIGGER_TYPE%/g, triggerType).replace(/\n\s+/g, ' '); // Minify SQL

          tx.executeSql(
            sql,
            [],
            () => console.log(`${triggerType} trigger created`),
            (tx, err) => console.error(`Error creating ${triggerType} trigger:`, err)
          );
        });
      });
    } else {
      console.error('SQLite plugin not available');
    }
  },
  false
);
