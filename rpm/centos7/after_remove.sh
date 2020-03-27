APP_NAME="beer-garden"
APP_HOME="/opt/${APP_NAME}"

USER="beergarden"
GROUP="beergarden"

CONFIG_HOME="$APP_HOME/conf"
LOG_HOME="$APP_HOME/log"

CONFIG_FILE="${CONFIG_HOME}/config.yaml"
LOG_CONFIG="${CONFIG_HOME}/logging.yaml"
LOG_FILE="$LOG_HOME/beergarden.log"

case "$1" in
    0)
        # This is an uninstallation
        # Remove the user
        /usr/sbin/userdel $USER
        /usr/sbin/groupdel $GROUP
    ;;
    1)
        # This is an upgrade.
        # Generate logging config if it doesn't exist
        if [ ! -f "$LOG_CONFIG" ]; then
            "$APP_HOME/bin/generate_log_config" \
                --log-config-file "$LOG_CONFIG" \
                --log-file "$LOG_FILE" \
                --log-level "WARN"
        fi

        # Migrate application config if it exists
        if [ -f "$CONFIG_FILE" ]; then
            "$APP_HOME/bin/migrate_config" -c "$CONFIG_FILE"
        fi
    ;;
esac

# Reload units
systemctl daemon-reload
