import React, {Component, PropTypes} from 'react';
import {Animated, ScrollView, View, StyleSheet, Platform, TouchableHighlight} from 'react-native';
import {shallowEqual, swapArrayElements} from './utils';
import Row from './Row';
const AUTOSCROLL_INTERVAL = 100;
const ZINDEX = Platform.OS === 'ios' ? 'zIndex' : 'elevation';

function uniqueRowKey(key) {
  return `${key}${uniqueRowKey.id}`
}

uniqueRowKey.id = 0
let _rowUnderActiveKey = -1;
let _nextOrder= -1;
export default class SortableList extends Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
    data1: PropTypes.object.isRequired,
    order: PropTypes.arrayOf(PropTypes.any),
    style: View.propTypes.style,
    contentContainerStyle: View.propTypes.style,
    sortingEnabled: PropTypes.bool,
    scrollEnabled: PropTypes.bool,
    renderRow: PropTypes.func.isRequired,
    vsView: PropTypes.func.isRequired,
    onChangeOrder: PropTypes.func,
    onActivateRow: PropTypes.func,
    onReleaseRow: PropTypes.func,
    autoscrollAreaHeight: PropTypes.number,
  };

  static defaultProps = {
    sortingEnabled: true,
    scrollEnabled: true,
    autoscrollAreaHeight: 60,
  }

  /**
   * Stores refs to rows’ components by keys.
   */
  _rows = {};

  /**
   * Stores promises of rows’ layouts.
   */
  _rowsLayouts = [];

  _contentOffset = {x: 0, y: 0};

  state = {
    order: this.props.order || Object.keys(this.props.data),
    order1: this.props.order1 || Object.keys(this.props.data1),
    rowsLayouts: null,
    containerLayout: null,
    data: this.props.data,
    data1: this.props.data1,
    activeRowKey: null,
    activeRowIndex: null,
    releasedRowKey: null,
    sortingEnabled: this.props.sortingEnabled,
    scrollEnabled: this.props.scrollEnabled,
    x:0,
    style: {
      opacity: new Animated.Value(0),
    },
  };

  componentDidMount() {
    this._onLayoutRows();
  }

  componentWillReceiveProps(nextProps) {

    const {data, order} = this.state;
    const {data: nextData, order: nextOrder} = nextProps;

    if (data && nextData && !shallowEqual(data, nextData)) {
      this._animateRowsDisappearance(() => {
        uniqueRowKey.id++;
        this._areRowsAnimated = false;
        this._rowsLayouts = [];
        this.setState({
          data: nextData,
          containerLayout: null,
          rowsLayouts: null,
          order: nextOrder || Object.keys(nextData)
        });
      });

    } else if (order && nextOrder && !shallowEqual(order, nextOrder)) {
      this.setState({order: nextOrder});
    }
  }

  componentDidUpdate(prevProps, prevState) {

    const {data} = this.state;
    const {data: prevData} = prevState;

    if (data && prevData && !shallowEqual(data, prevData)) {
      this._onLayoutRows();
    }
  }

  scrollBy({dy = 0, animated = false}) {
    this._contentOffset = {
      x: this._contentOffset.x,
      y: this._contentOffset.y + dy,
    };
    this._scroll(animated);
  }

  scrollTo({y = 0, animated = false}) {
    this._contentOffset = {
      x: this._contentOffset.x,
      y,
    };
    this._scroll(animated);
  }

  scrollToRowKey({key, animated = false}) {
    const {order, containerLayout, rowsLayouts} = this.state;

    let keyY = 0;

    for (let rowKey of order) {
      if (rowKey === key) {
          break;
      }

      keyY += rowsLayouts[rowKey].height;
    }

    // Scroll if the row is not visible.
    if (
      keyY < this._contentOffset.y ||
      keyY > this._contentOffset.y + containerLayout.height
    ) {
      this._contentOffset = {
        x: this._contentOffset.x,
        y: keyY,
      };
      this._scroll(animated);
    }
  }

  render() {
    const {contentContainerStyle} = this.props;
    const {contentHeight, scrollEnabled} = this.state;
    const containerStyle = StyleSheet.flatten([styles.container, this.props.style, this.state.style]);

    //*> If selected item x location is greater than 0
      _vsView = this._renderVsOnRows(this.state.data1,this.state.data, this.state.order1,this.state.order, this.props.width/2)
      _barView= this._renderBarOnRows(this.state.data1,this.state.data, this.state.order1, this.props.width)

    return (
      <Animated.View style={containerStyle} ref={this._onRefContainer}>
        <ScrollView
          ref={this._onRefScrollView}
          contentContainerStyle={contentContainerStyle}
          scrollEventThrottle={2}
          scrollEnabled={scrollEnabled}
          onScroll={this._onScroll}>
          <View style={[styles.container, {height: contentHeight}]}>
            <View style={[styles.container_new]}>
              {this._renderRows(this.state.data, this.state.order, 0, true)}
              {this._renderRows(this.state.data1, this.state.order1, this.props.width/2, true)}
            </View>
            <View style={[styles.container_new]}>
              {this._renderRows(this.state.data, this.state.order, 0, false)}
              {this._renderRows(this.state.data1, this.state.order1, this.props.width/2, false)}
              {_barView}
              {_vsView}
            </View>
            
          </View>
        </ScrollView>
      </Animated.View>
    );
  }

  _renderVsOnRows(data,data1, order,order1, _x) {
    const {sortingEnabled, vsView} = this.props;
    const { activeRowKey, releasedRowKey, rowsLayouts} = this.state;
    const rowWidth = rowsLayouts && Math.max(
      ...Object.keys(rowsLayouts).map((key) => rowsLayouts[key].width)
    );
    let nextY = 0;

    return order.map((key, index) => {
      const style = {[ZINDEX]: 0};
      const location = {x: _x, y: 0};
      let resolveLayout;

      if (rowsLayouts) {
        style.marginLeft = -25
        style.marginTop =(data[order[index]].playerData!=null && data1[order1[index]].playerData!=null )?-10:25
        location.y = nextY;
        nextY += rowsLayouts[key].height;
      } else {
        //this._rowsLayouts.push(new Promise((resolve) => (resolveLayout = resolve)));
      }

      const active = activeRowKey === key;
      const released = releasedRowKey === key;

      if (active || released) {
        style[ZINDEX] = 99;
      }

      return (
        <Row
          key={uniqueRowKey(key)}
          animated={false}
          disabled={true}
          style={style}
          location={location}>
          {vsView({
            key,
            data: data[key],
            disabled: !sortingEnabled,
            active,
            index,
            x:_x
          })}
        </Row>
      );
    });

  }

  _renderBarOnRows(data,data1, order, _x) {

    const {sortingEnabled, barView} = this.props;
    const { activeRowKey, releasedRowKey, rowsLayouts} = this.state;

    const rowWidth = rowsLayouts && Math.max(
      ...Object.keys(rowsLayouts).map((key) => rowsLayouts[key].width)
    );
    let nextY = 0;

    return order.map((key, index) => {
      const style = {[ZINDEX]: 0};
      const location = {x: _x, y: 0};
      let resolveLayout;

      if (rowsLayouts) {
        style.marginLeft = -(this.props.width-2)
        style.marginTop =(this.props.isTablet)?77:57
        location.y = nextY;
        nextY += rowsLayouts[key].height;
      } else {
        //this._rowsLayouts.push(new Promise((resolve) => (resolveLayout = resolve)));
      }

      const active = activeRowKey === key;
      const released = releasedRowKey === key;

      if (active || released) {
        style[ZINDEX] = 99;
      }

      return (
        <Row
          key={uniqueRowKey(key)}
          animated={false}
          disabled={true}
          style={style}
          location={location}>
          {barView({
            key,
            data: data[key],
            data1:data1[index],
            disabled: !sortingEnabled,
            active,
            index,
            x:_x
          })}
        </Row>
      );
    });

  }

  _renderRows(data, order, _x, isBottom) {
    const {sortingEnabled, renderRow, onPress, onMoveRow} = this.props;
    const { activeRowKey, releasedRowKey, rowsLayouts} = this.state;

    const rowWidth = rowsLayouts && Math.max(
      ...Object.keys(rowsLayouts).map((key) => rowsLayouts[key].width)
    );
    let nextY = 0;

    return order.map((key, index) => {
      const style = {[ZINDEX]: 0};
      const location = {x: _x, y: 0};
      let resolveLayout;

      if (rowsLayouts) {
        style.width = this.props.width/2;
        location.y = nextY;
        nextY += rowsLayouts[key].height;
      } else {
        this._rowsLayouts.push(new Promise((resolve) => (resolveLayout = resolve)));
      }

      const active = activeRowKey === key;
      const released = releasedRowKey === key;

      if ((active || released) && !isBottom) {
        style[ZINDEX] = 100;
      }

      return (
        <Row
          key={uniqueRowKey(key)}
          ref={this._onRefRow.bind(this, key)}
          animated={this._areRowsAnimated && !active}
          disabled={!sortingEnabled}
          style={style}
          location={location}
          onLayout={!rowsLayouts ? this._onLayoutRow.bind(this, resolveLayout, key) : null}
          onActivate={this._onActivateRow.bind(this, key, index)}
          onRelease={this._onReleaseRow.bind(this, key)}
          onMove={this._onMoveRow}
          onMoveRow = {onMoveRow}
          onPress={onPress}
          title={_x == 0 ? 'SELECT BATTER' : 'SELECT PITCHER'}
          index={index}>
          {renderRow({
            key,
            data: data[key],
            disabled: !sortingEnabled,
            active,
            index,
            x:_x
          })}
        </Row>
      );
    });
  }

  _onLayoutRows() {
    Promise.all([...this._rowsLayouts])
      .then((rowsLayouts) => {
        // Can get correct container’s layout only after rows’s layouts.
        this._container.measure((x, y, width, height, pageX, pageY) => {
          const rowsLayoutsByKey = {};
          let contentHeight = 0;
          rowsLayouts.forEach(({rowKey, layout}) => {
            rowsLayoutsByKey[rowKey] = layout;
            contentHeight += layout.height;
          });
          contentHeight = contentHeight / 4;
          this.setState({
            containerLayout: {x, y, width, height, pageX, pageY},
            rowsLayouts: rowsLayoutsByKey,
            contentHeight,
          }, () => {
            this._animateRowsAppearance(() => (this._areRowsAnimated = true));
          });
        });
      });
  }

  _animateRowsAppearance(onAnimationEnd) {
    Animated.timing(this.state.style.opacity, {
      toValue: 1,
    }).start(onAnimationEnd);
  }

  _animateRowsDisappearance(onAnimationEnd) {
    Animated.timing(this.state.style.opacity, {
      toValue: 0,
    }).start(onAnimationEnd);
  }

  _scroll(animated) {
    this._scrollView.scrollTo({...this._contentOffset, animated});
  }

  /**
   * Finds a row under the moving row, if they are neighbours,
   * swaps them, else shifts rows.
   */
  _setOrderOnMove(_x) {

    var order = {}

    if (_x > 0) {
      order = this.state.order1
    } else{
      order = this.state.order
    }

    const {activeRowKey, activeRowIndex} = this.state;

    if (activeRowKey === null || this._autoScrollInterval) {
      return;
    }

    let {
      rowKey: rowUnderActiveKey,
      rowIndex: rowUnderActiveIndex,
    } = this._findRowUnderActiveRow(_x);

    if (this._movingDirectionChanged) {
      this._prevSwapedRowKey = null;
    }

    // Swap rows if necessary.
    if (rowUnderActiveKey !== activeRowKey && rowUnderActiveKey !== this._prevSwapedRowKey) {
      const isNeighbours = Math.abs(rowUnderActiveIndex - activeRowIndex) === 1;
      let nextOrder;

      // If they are neighbours, swap elements, else shift.
      if (isNeighbours) {

        this._prevSwapedRowKey = rowUnderActiveKey;
        nextOrder = swapArrayElements(order, activeRowIndex, rowUnderActiveIndex);
      } else {
        nextOrder = order.slice();
        nextOrder.splice(activeRowIndex, 1);
        nextOrder.splice(rowUnderActiveIndex, 0, activeRowKey);
      }

      _rowUnderActiveKey = rowUnderActiveKey;

    } else if(rowUnderActiveKey == this._prevSwapedRowKey)  {
      _rowUnderActiveKey = rowUnderActiveKey;
    }else{
      _rowUnderActiveKey = activeRowKey;
    }
  }

  /**
   * Finds a row, which was covered with the moving row’s half.
   */
  _findRowUnderActiveRow(_x) {

    var order = {}

    if (_x > 0) {
      order = this.state.order1
    } else{
      order = this.state.order
    }

    const {rowsLayouts, activeRowKey, activeRowIndex} = this.state;
    const movingRowLayout = rowsLayouts[activeRowKey];
    const rowTopY = this._activeRowLocation.y;
    const rowBottomY = rowTopY + movingRowLayout.height;

    for (
      let currentRowIndex = 0, y = 0, rowsCount = order.length;
      currentRowIndex < rowsCount - 1;
      currentRowIndex++
    ) {
      const currentRowKey = order[currentRowIndex];
      const currentRowLayout = rowsLayouts[currentRowKey];
      const nextRowIndex = currentRowIndex + 1;
      const nextRowLayout = rowsLayouts[order[nextRowIndex]];

      y = y + currentRowLayout.height;

      if (currentRowKey !== activeRowKey &&
        (y - currentRowLayout.height <= rowTopY || currentRowIndex === 0) &&
        rowTopY <= y - currentRowLayout.height / 3
      ) {
        return {
          rowKey: order[currentRowIndex],
          rowIndex: currentRowIndex,
        };
      }

      if (y + nextRowLayout.height / 3 <= rowBottomY &&
        (rowBottomY <= y + nextRowLayout.height || nextRowIndex === rowsCount - 1)
      ) {
        return {
          rowKey: order[nextRowIndex],
          rowIndex: nextRowIndex,
        };
      }
    }

    return {rowKey: activeRowKey, rowIndex: activeRowIndex};
  }

  _scrollOnMove(e) {

    const {pageY} = e.nativeEvent;
    const {containerLayout} = this.state;
    const inAutoScrollUpArea = pageY < containerLayout.pageY + this.props.autoscrollAreaHeight;
    const inAutoScrollDownArea = pageY > containerLayout.pageY + containerLayout.height - this.props.autoscrollAreaHeight;

    if (!inAutoScrollUpArea &&
      !inAutoScrollDownArea &&
      this._autoScrollInterval !== null
    ) {
      this._stopAutoScroll();
    }

    // It should scroll and scrolling is processing.
    if (this._autoScrollInterval !== null) {
      return;
    }

    if (inAutoScrollUpArea) {
      this._startAutoScroll({
        direction: -1,
        shouldScroll: () => this._contentOffset.y > 0,
        getScrollStep: (stepIndex) => {
          const nextStep = this._getScrollStep(stepIndex);

          return this._contentOffset.y - nextStep < 0
            ? this._contentOffset.y
            : nextStep;
        },
      });
    } else if (inAutoScrollDownArea) {
      this._startAutoScroll({
        direction: 1,
        shouldScroll: () => {
          const {contentHeight, containerLayout} = this.state;

          return this._contentOffset.y < contentHeight - containerLayout.height;
        },
        getScrollStep: (stepIndex) => {
          const nextStep = this._getScrollStep(stepIndex);
          const {contentHeight, containerLayout} = this.state;

          return this._contentOffset.y + nextStep > contentHeight - containerLayout.height
            ? contentHeight - containerLayout.height - this._contentOffset.y
            : nextStep;
        },
      });
    }
  }

  _getScrollStep(stepIndex) {
    return stepIndex > 3 ? 60 : 30;
  }

  _startAutoScroll({direction, shouldScroll, getScrollStep}) {

    if (!shouldScroll()) {
      return;
    }

    const {activeRowKey} = this.state;
    let counter = 0;

    this._autoScrollInterval = setInterval(() => {
      if (shouldScroll()) {
        const dy = direction * getScrollStep(counter++);
        this.scrollBy({dy});
        this._rows[activeRowKey].moveBy({dy});
      } else {
        this._stopAutoScroll();
      }
    }, AUTOSCROLL_INTERVAL);
  }

  _stopAutoScroll() {

    clearInterval(this._autoScrollInterval);
    this._autoScrollInterval = null;
  }

  _onLayoutRow(resolveLayout, rowKey, {nativeEvent: {layout}}) {
    resolveLayout({rowKey, layout});
  }

  _onActivateRow = (rowKey, index, e, gestureState, location) => {
    console.log('rowKey, index, e, gestureState, location',rowKey, index,  gestureState, location);
    this._activeRowLocation = location;

    _rowUnderActiveKey = rowKey;

    this.setState({
      activeRowKey: rowKey,
      activeRowIndex: index,
      releasedRowKey: null,
      scrollEnabled: false,
      x:location.x
    });

    if (this.props.onActivateRow) {
      this.props.onActivateRow(rowKey);
    }
  };

  _onReleaseRow = (rowKey) => {

    this._stopAutoScroll();

    //*> Replacing object with each other

    var items = this.state.order;
    var data = this.state.data

    var index1 = items.indexOf(rowKey);
    var index2 = items.indexOf(_rowUnderActiveKey);

    if (index1 == -1) {
      items = this.state.order1;
      data = this.state.data1;
      var data_right = data[rowKey];
      data[_rowUnderActiveKey] = Object.assign({}, data_right);
      this.setState({
        order1:items,
        data1:data
      });

    } else {
      var data_left = data[index1];
      data[index2] = Object.assign({}, data_left);
      this.setState(({activeRowKey}) => ({
        order:items,
        data:data
      }));
    }

    var _this = this;

    setTimeout(function () {
      _this.setState(({activeRowKey}) => ({
        activeRowKey: null,
        scrollEnabled: true
      }));

      if (_this.props.onReleaseRow) {
        _this.props.onReleaseRow(rowKey, index2,_rowUnderActiveKey);
      }

    }, 1);


  };

  _onMoveRow = (e, gestureState, location) => {
    const prevMovingRowY = this._activeRowLocation.y;
    const prevMovingDirection = this._movingDirection;

    this._activeRowLocation = location;
    this._movingDirection = prevMovingRowY < this._activeRowLocation.y;

    this._movingDirectionChanged = prevMovingDirection !== this._movingDirection;
    this._setOrderOnMove(this._activeRowLocation.x);

    this._scrollOnMove(e);


  };

  _onScroll = ({nativeEvent: {contentOffset}}) => {
      this._contentOffset = contentOffset;
  };

  _onRefContainer = (animatedComponent) => {
    this._container = animatedComponent && animatedComponent._component;
  };

  _onRefScrollView = (component) => {
    this._scrollView = component;
  };

  _onRefRow = (rowKey, component) => {
    this._rows[rowKey] = component;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  container_new: {
    flex: 1,
    flexDirection:'row',
    position:'absolute',
    top:0,
    left:0,
    right:0,
    bottom:0
  },
});
