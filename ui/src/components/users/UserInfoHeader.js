import React, { Component } from "react";
import PropTypes from "prop-types";
import { compose } from "recompose";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Hidden from "@material-ui/core/Hidden";
import Typography from "@material-ui/core/Typography";
import AccountBox from "@material-ui/icons/AccountBox";
import Delete from "@material-ui/icons/Delete";
import Edit from "@material-ui/icons/Edit";

const styles = theme => ({
  leftIcon: { marginRight: theme.spacing.unit },
  rightIcon: { marginLeft: theme.spacing.unit },
  error: { color: theme.palette.error.dark },
  headerRow: { display: "flex", flexDirection: "row" },
  rightButton: { marginLeft: "auto" },
});

export class UserInfoHeader extends Component {
  renderTitle = () => {
    const { classes } = this.props;
    return (
      <>
        <Hidden xsDown>
          <AccountBox className={classes.leftIcon} fontSize="large" />
          <Typography variant="h4">User Information</Typography>
        </Hidden>
        <Hidden smUp>
          <Typography variant="h4">User Info</Typography>
        </Hidden>
      </>
    );
  };

  renderButtons = () => {
    const { classes, canEdit, canDelete, onEdit, onDelete } = this.props;
    let editButton = null;
    let deleteButton = null;
    if (canEdit) {
      editButton = (
        <Button color="primary" onClick={onEdit}>
          <Hidden xsDown>Edit</Hidden>
          <Edit className={classes.rightIcon} fontSize="small" />
        </Button>
      );
    }

    if (canDelete) {
      deleteButton = (
        <Button className={classes.error} onClick={onDelete}>
          <Hidden xsDown>Delete</Hidden>
          <Delete className={classes.rightIcon} fontSize="small" />
        </Button>
      );
    }
    return (
      <>
        {deleteButton}
        {editButton}
      </>
    );
  };

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.headerRow}>
        {this.renderTitle()}
        <div className={classes.rightButton}>{this.renderButtons()}</div>
      </div>
    );
  }
}

UserInfoHeader.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  canDelete: PropTypes.bool.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

const enhance = compose(withStyles(styles));

export default enhance(UserInfoHeader);
