export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/verify/index',
    'pages/report/index',
    'pages/mine/index',
    'pages/verify-detail/index',
    'pages/report-detail/index',
    'pages/history/index',
    'pages/shift-summary/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E56A0',
    navigationBarTitleText: '航材寿命核验',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F1F5F9'
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#1E56A0',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/verify/index',
        text: '快速核验'
      },
      {
        pagePath: 'pages/report/index',
        text: '异常上报'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
