import React from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  RefreshControl,
  View,
  StyleSheet,
} from 'react-native';
import { Flex, Icon } from '@ant-design/react-native';
import _ from 'lodash'
import BigNumber from "bignumber.js";
import { observable, computed } from "mobx";
import { inject, observer, Observer } from 'mobx-react';
import LinearGradient from 'react-native-linear-gradient';
import { toPriceString, toFixedLocaleString, toFixedNumber } from "../../utils/NumberUtil";
import { BTCCoin, ETH } from '../../stores/wallet/Coin';
import { styles as themeStyles, MainColor } from '../../theme';
import GlobalNavigation from '../../utils/GlobalNavigation';
import Container from '../../components/Container';
import FlatListLoadMoreView from "../../components/FlatListLoadMoreView";
import DrawerIcon from '../../components/DrawerIcon';
import CoinStore from '../../stores/wallet/CoinStore';
import AssetsHeader from './components/AssetsHeader'
import TitleBar from '../../components/TitleBar';
import CommonAccount from '../../stores/account/CommonAccount';
import HDAccount from '../../stores/account/HDAccount';

const cellStyles = StyleSheet.create({
  cellFlex: {
    ...themeStyles.shadow,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 0,
    padding: 5,
  },
  cellCoin: {
    width: 40,
    height: 40,
  },
  nameView: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    width: 125,
  },
  coinName: {
    fontSize: 14,
    color: '#3D3D3D',
    flex: 1,
    fontWeight: '500',
    marginBottom: 5,
  },
  coinPrice: {
    fontSize: 14,
    color: '#3D3D3D',
    flex: 1,
    fontWeight: '500',
    maxWidth: 110,
  },
  coinBalance: {
    fontSize: 12,
    color: '#3D3D3D',
    flex: 1,
    fontWeight: '500',
    marginBottom: 5,
    textAlign: 'right',
  },
  coinTotal: {
    ...themeStyles.subTitle,
    color: '#49A303',
    textAlign: 'left',
    maxWidth: 110,
  },
  rightView: {
    alignItems: 'flex-end',
    height: 60,
    paddingTop: 10,
    paddingBottom: 12,
    marginRight: 8,
  }
});


@inject('store')
@observer
class CoinCell extends React.Component {
  @computed get balance() {
    const { isHiddenPrice, coin } = this.props
    if (isHiddenPrice) {
      return "*****";
    }

    const balance = (coin.others || []).reduce((total, coin) => total + coin.balance, coin.balance)
    const bigNumber = new BigNumber(`${balance}`);
    if (bigNumber.isLessThan(0)) {
      return "-"
    }
    return toFixedLocaleString(bigNumber, coin.name === 'BTC' || coin.name === 'ETH' ? 8 : 4, true)
  }

  @computed get price() {
    const { coin } = this.props
    return (CoinStore[`${coin.name}Price`] || 0)
    // return coin.price
  }

  @computed get totalPrice() {
    const { coin, isHiddenPrice } = this.props
    if (isHiddenPrice) {
      return "*****";
    }
    if (this.balance === "-") {
      return "-";
    }
    const balance = new BigNumber(`${this.balance}`);
    if (balance.isLessThan(0)) {
      return 0;
    }
    const totalPrice = toFixedNumber(balance.multipliedBy(`${this.price}`), 2);
    // this.props.coin.totalPrice
    return `≈ ${CoinStore.currencySymbol} ${toPriceString(totalPrice, 2, 4, true)}`;
  }

  render() {
    const { coin } = this.props;
    return (
      <TouchableOpacity
        style={{ marginBottom: 10 }}
        onPress={() =>
          GlobalNavigation.navigate('History', {
            coin: coin,
            coinID: coin.id,
          })
        }>
        <Flex justify="between" style={cellStyles.cellFlex}>
          <Flex>
            <Image
              source={{ uri: coin.icon }}
              resizeMode="contain"
              style={cellStyles.cellCoin}
            />
            <View style={cellStyles.nameView}>
              <Text style={cellStyles.coinName}>
                {this.props.coin.name}
              </Text>
              <Text ellipsizeMode={'tail'} style={cellStyles.coinPrice}>
                {CoinStore.currencySymbol} {toPriceString(this.price, 2, 4, true)}
              </Text>
            </View>
          </Flex>
          <View style={cellStyles.rightView}>
            <Text style={cellStyles.coinBalance}>
              {this.balance}
            </Text>
            <Text ellipsizeMode={'tail'} style={cellStyles.coinTotal}>
              {this.totalPrice}
            </Text>
          </View>
        </Flex>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  touchAction: {
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
  },
  flat: {
    margin: 26,
  },
  flatContent: {
    // alignItems: 'center',
  },
  loadMore: {
    backgroundColor: "transparent",
  },
});

@inject('store')
@observer
class Wallet extends React.Component {
  state = {
    name: '',
    showSavingComing: false,
    showBorrowComing: false,
  };

  @observable isRefreshing = false;

  @computed get account() {
    const { accountStore } = this.props.store
    return accountStore.currentAccount;
    // return accountStore.defaultHDAccount;
  }

  @computed get username() {
    const { accountStore } = this.props.store
    return accountStore.credentials && accountStore.credentials.username;
  }

  @computed get coins() {
    const { accountStore } = this.props.store
    let coins = []
    const coinsMap = new Map()
    accountStore.accounts.forEach(
      account => {
        account.coins.forEach((coin) => {
          const hasCoin = coinsMap.get(coin.name)
          if (coins[hasCoin]) {
            coins[hasCoin].others.push(coin)
          } else {
            coins.push({
              ...coin,
              others: []
            })
            coinsMap.set(coin.name, coins.length - 1)
          }
        })
      }
    )
    return coins;
    // if (this.account && this.account.displayChange) {
    //   return this.account.coins
    // }
    // return this.account.coins.filter(coin => coin && (coin.totalPrice >= 100 || coin.balance >= 100))
  }

  _onRefresh = async () => {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;
    try {
      // await this.account.update();
    } catch (error) { }

    setTimeout(() => {
      this.isRefreshing = false;
    }, 100);
  };

  _renderItem = ({ item }) => (
    <Observer>{() => <CoinCell coin={item} isHiddenPrice={this.props.store.accountStore.isHiddenPrice} />}</Observer>
  );

  render() {
    return (
      <Container style={{ backgroundColor: '#f7f7f7' }}>
        <LinearGradient
          colors={MainColor}
          useAngle={true}
          angle={90}
          angleCenter={{ x: 0.5, y: 0 }}
          style={{
            borderBottomLeftRadius: 6,
            borderBottomRightRadius: 6,
            height: 230,
          }}>
          <TitleBar
            title={this.username}
            renderLeft={() => (
              <DrawerIcon dot={this.props.store.common.newVersion} />
            )}
            renderRight={() => (
              <TouchableOpacity style={{ marginRight: 20 }} onPress={() => { }}><Icon name="ellipsis" /></TouchableOpacity>
            )}
          />
          <AssetsHeader coins={this.coins} />
        </LinearGradient>
        <FlatList
          refreshControl={
            <RefreshControl
              refreshing={this.isRefreshing}
              onRefresh={this._onRefresh}
            />
          }
          showsVerticalScrollIndicator={false}
          data={this.coins}
          keyExtractor={(item, index) => index.toString()}
          style={styles.flat}
          contentContainerStyle={styles.flatContent}
          renderItem={this._renderItem}
          ListFooterComponent={<FlatListLoadMoreView status={"nomore"} style={styles.loadMore} />}
        />
      </Container>
    );
  }
}

export default Wallet;
