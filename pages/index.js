import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'
import utilStyles from '../styles/utils.module.css'
import { getSortedPostsData } from '../lib/posts'
import Link from 'next/link'
import Date from '../components/date'

export default function Home({ allPostsData }) {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p>Hello, my name is Emanuele Ianni and I try to be build stuff people use.</p>
        <p>My GitHub repository is located <a href="https://github.com/invasionofsmallcubes">here</a></p>
        <p>My LinkedIn page is located <a href="https://www.linkedin.com/in/emanueleianni">here</a></p>
        <p>My Twitter handler is <a href="https://twitter.com/IsTDDDeadYet">IsTDDDeadYet</a></p>
        <p>My Twitch handler is <a href="https://www.twitch.tv/theinvasionofsmallcubes">theinvasionofsmallcubes</a></p>
      </section>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Blog</h2>
        <ul className={utilStyles.list}>
          {allPostsData.map(({ id, date, title }) => (
            <li className={utilStyles.listItem} key={id}>
              <Link href="/posts/[id]" as={`/posts/${id}`}>
                <a>{title}</a>
              </Link>
              <br />
              <small className={utilStyles.lightText}>
                <Date dateString={date} />
              </small>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  )
}

export async function getStaticProps() {
  const allPostsData = getSortedPostsData()
  return {
    props: {
      allPostsData
    }
  }
}
