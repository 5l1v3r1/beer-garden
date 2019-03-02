import React, { Component } from "react";
import PropTypes from "prop-types";
import { compose } from "recompose";
import { withStyles } from "@material-ui/core/styles";
import { Switch, withRouter } from "react-router-dom";
import Paper from "@material-ui/core/Paper";
import AuthRoute from "../auth/AuthRoute";
import RolesAddContainer from "./RolesAddContainer";
import RolesListContainer from "./RolesListContainer";
import RolesViewContainer from "./RolesViewContainer";

const styles = theme => ({
  root: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
  },
});

export class RolesRoot extends Component {
  render() {
    const { classes, match } = this.props;
    return (
      <Paper className={classes.root}>
        <Switch>
          <AuthRoute
            exact
            path={`${match.path}/`}
            component={RolesListContainer}
          />
          <AuthRoute
            exact
            path={`${match.path}/add`}
            component={RolesAddContainer}
          />
          <AuthRoute
            exact
            path={`${match.path}/:name`}
            component={RolesViewContainer}
          />
        </Switch>
      </Paper>
    );
  }
}

RolesRoot.propTypes = {
  match: PropTypes.object.isRequired,
};

const enhanced = compose(
  withRouter,
  withStyles(styles),
);

export default enhanced(RolesRoot);