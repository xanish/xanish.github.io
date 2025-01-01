+++
title = 'Understanding Bloom Filters: A Simple Guide'
date = 2025-01-01T19:27:17+05:30
draft = false
[params]
math = true
+++
When dealing with large databases verifying whether an item belongs to a collection can be a slow and tedious process. Common data structures like hash tables, trees, and arrays can be slow or memory-intensive when you're dealing with millions or billions of elements. This is where a Bloom Filter can help. It offers a faster and more memory-efficient approach than the aforementioned datasets, with some caveats.

In this post, we will learn what Bloom Filters are, how they work, and how we can optimize them for our use. We will also see a simple implementation of the same in Go!

## What is a bloom filter?

A Bloom Filter is a probabilistic data structure used to check if an element is **possibly** in a set or **definitely not** in a set. It is extremely efficient in terms of speed and memory usage. But the catch is that sometimes it can cause **false positives**.

**False positives** occur when the filter says something is in the set. Even if this isn't the case. But if the filter says there is no element You can be 100% sure that there are no such elements.

## Where are Bloom Filters used?

Some IRL examples of using Bloom Filters include:
- Databases like Cassandra use Bloom Filters to prevent reads from SSTables.
- Web crawlers use them to prevent re-crawling of same pages.
- Intrusion detection systems can use them to store suspicious IPs and control access based off it.
- Email spam filters use them to flag spam.
- Blockchains use them to check if a transaction has already been processed.

## How Do Bloom Filters Work?

Simply put, they work by hashing elements with different hash functions. Then mark the specific bits corresponding to those hashes in the bit array. Let's look at it step by step:

1. **Create a Bit Array**: Start with a large array of bits, all set to 0.
2. **Hash the Input**: When an element is added, it is hashed using different hash functions. Each function produces an index in the bit array.
3. **Set the Bits**: For each hash result, set the corresponding bit in the array to 1.
4. **Check Membership**: To check if an element is in the set, hash it again using the same functions. If all the corresponding bits are 1, the element **might** be in the set. If any bit is 0, the element is **definitely not** in the set.

There are a few things to keep in mind though. First, the **hash functions** don't need to be cryptographically secure. They just need to be fast and distribute values uniformly across the bit array. Common choices include Murmur, FNV-1, or other simple, non-cryptographic hash functions.

The main concern is the possibility of **false positives**. As you add more elements to a Bloom Filter, the chance of a false positive increases. This is the trade-off for the efficiency and space-saving benefits it provides.

Additionally, **Bloom Filters do not support deletions**. Once an item is added, it can’t be removed. Doing so could unintentionally affect other elements that share the same bits.

## Not A One Size Fits All

The effectiveness of a Bloom Filter depends on its size and the number of hash functions used. There is no one size fits all and every use case needs to fine-tune the following parameters to get the most out of it:
- The **size of the bit array** (m).
- The **number of hash functions** (k).

#### Calculating the Optimal Size of the Bit Array (m)

The **optimal size** of the bit array is calculated with the formula:

\[
m = \frac{-n \cdot \ln(p)}{(\ln(2))^2}
\]

Where:
- \(n\) is the **number of elements** you plan to add to the filter.
- \(p\) is the **acceptable false positive rate** (between 0 and 1). For example, if you can tolerate a 1% false positive rate, \(p = 0.01\).

This formula calculates how large the bit array needs to be to keep the false positive rate at the specified level, given the expected number of elements.

#### Calculating the Optimal Number of Hash Functions (k)

Once you know the size of the bit array, you can calculate the **optimal number of hash functions** (k) to use with the following formula:

\[
k = \frac{m}{n} \cdot \ln(2)
\]

Where:
- \(m\) is the **size of the bit array** (calculated above).
- \(n\) is the **number of elements** you expect to add.

This formula helps you choose the best number of hash functions to minimize the false positive rate and ensure the filter performs efficiently.

#### Example

Let’s say you expect to add **1 million elements** (n = 1,000,000) to the Bloom Filter and want a **false positive rate of 1%** (p = 0.01). Using the formulas:

- **Bit array size (m)** = 9,585,059 bits or 1.2MB.
- **Number of hash functions (k)** = 7.

These parameters will give you a Bloom Filter that’s efficient in terms of both memory and accuracy.

### Don’t Go Overboard with Hash Functions

It might seem like using more hash functions would improve the accuracy by reducing false positives. However, using too many hash functions can actually hurt performance. It increases the likelihood of hash collisions and also slows down both reads and writes to the filter. The key is finding that sweet spot, which you can do using the formulas above.

## Scalable Bloom Filters

In some cases, it’s difficult to predict the exact number of elements you’ll be working with ahead of time. This is where **Scalable Bloom Filters** come into play. These filters start with a small bit array and automatically grow as the dataset expands. When the bit array fills up beyond a certain threshold, a new, larger filter is created for subsequent data. The size of each new filter grows exponentially, and queries are checked across all filters to verify the presence of an element.

Scalable Bloom Filters are particularly useful when the size of the dataset is unpredictable. However, they introduce additional complexity. Managing multiple filters and ensuring that queries are efficiently processed across all of them can require extra effort and resources.

## Example Implementation in Go

Here’s a simple implementation of a Bloom Filter in Go:

```go
package bloomfilter

import (
	"fmt"
	"hash"
	"hash/fnv"
	"math"
)

type BloomFilter struct {
	bits      []bool        // The bit array where membership data is stored.
	size      uint          // The size of the bit array.
	hashFuncs []hash.Hash32 // A slice of hash functions used for hashing the input.
}

// New initializes a new Bloom Filter with the given number of elements (n) and the desired false positive rate (p).
// It calculates the size of the bit array and the number of hash functions.
func New(n uint, p float64) *BloomFilter {
	// Calculate the optimal size of the bit array (m) based on the formula:
	// m = - (n * ln(p)) / (ln(2))^2
	m := uint(math.Ceil((-float64(n) * math.Log(p)) / (math.Pow(math.Log(2), 2))))

	// Calculate the optimal number of hash functions (k) based on the formula:
	// k = (m / n) * ln(2)
	k := uint(math.Ceil((float64(m) / float64(n)) * math.Log(2)))

	hashes := make([]hash.Hash32, 0, k)
	for i := 0; i < int(k); i++ {
		// Initialize a slice to hold 'k' hash functions. In this example, we are using the same FNV-32 hash function
		// for all 'k' functions. Ideally, we would use different hash functions or hash functions that support seeding
		// to improve distribution and reduce collisions. To compensate for this, we will append a unique seed suffix to
		// each key to simulate different hash functions, ensuring diversity in hash outputs.
		hashes = append(hashes, fnv.New32())
	}

	return &BloomFilter{
		bits:      make([]bool, m),
		size:      m,
		hashFuncs: hashes,
	}
}

// Add adds a new element (key) to the Bloom Filter.
// This operation sets the bits in the bit array based on the hashed values of the key.
func (bf *BloomFilter) Add(key string) {
	indices := bf.hashes(key)
	for _, index := range indices {
		bf.bits[index] = true
	}
}

// Has checks if a given element (key) might be in the Bloom Filter.
// It returns true if the element might exist, and false if it is definitely not in the filter.
func (bf *BloomFilter) Has(key string) bool {
	indices := bf.hashes(key)
	for _, index := range indices {
		if !bf.bits[index] {
			return false
		}
	}

	return true
}

// hashes generates the indices in the bit array based on the key using multiple hash functions.
func (bf *BloomFilter) hashes(key string) []uint {
	indices := make([]uint, 0, len(bf.hashFuncs))
	for i, h := range bf.hashFuncs {
		h.Reset()

		// Generate a unique string by appending a seed value (based on hash function index)
		// This ensures that each hash function produces different outputs for the same key.
		_, _ = h.Write([]byte(fmt.Sprintf("%s:seed%d", key, i)))

		// Calculate the hash and compute the index in the bit array using modulo operation
		indices = append(indices, uint(h.Sum32())%bf.size)
	}

	return indices
}
```

And here's the driver / test file to verify our implementation: 

```go main_test.go
package bloomfilter

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

const (
	filterSize        = 1000000
	falsePositiveRate = 0.01
)

func TestBloomFilter(t *testing.T) {
	bf := New(filterSize, falsePositiveRate)

	bf.Add("item-1")
	bf.Add("item-2")
	bf.Add("item-3")

	count := 0
	for _, val := range bf.bits {
		if val == true {
			count++
		}
	}

	assert.True(t, bf.Has("item-1"))
	assert.True(t, bf.Has("item-2"))
	assert.True(t, bf.Has("item-3"))
	assert.False(t, bf.Has("item-4"))
}

func BenchmarkBloomFilter_Add(b *testing.B) {
	bf := New(filterSize, falsePositiveRate)

	for i := 0; i < b.N; i++ {
		bf.Add(fmt.Sprintf("item-%d", i))
	}
}

func BenchmarkBloomFilter_Has(b *testing.B) {
	bf := New(filterSize, falsePositiveRate)

	for i := 0; i < b.N; i++ {
		bf.Add(fmt.Sprintf("item-%d", i))
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		bf.Has(fmt.Sprintf("item-%d", i%500))
	}
}
```

### Benchmark Results
To measure the performance of the Bloom Filter, we ran the following benchmark:

```bash
$ go test -bench=.
```

```bash
goos: linux
goarch: amd64
pkg: github.com/xanish/bloom-filter
cpu: AMD Ryzen 5 7600X 6-Core Processor             
BenchmarkBloomFilter_Add-12      1636203               689.0 ns/op
BenchmarkBloomFilter_Has-12      1832988               653.4 ns/op
PASS
ok      github.com/xanish/bloom-filter  5.686s
```

Even though the code is fairly simple and does not consider every possible optimisation we still get pretty fast operations at around 690ns. You can check out the repo on my [GitHub](https://github.com/xanish/bloom-filter).

## Conclusion

Bloom Filters are a fantastic tool for efficiently checking membership in large sets while minimizing memory usage. They’re especially useful in applications where speed is critical, and a small error rate (false positives) is acceptable.

By understanding how Bloom Filters work and how to calculate their parameters, you can optimize performance in a variety of applications, from caching to large-scale data processing. Their low memory footprint and high-speed performance make them a powerful solution for many systems.

And if you’re concerned about the limitations of fixed-size filters, don’t forget about scalable Bloom Filters, which can adjust dynamically as your dataset grows.

If you’re interested in trying it out, give it a shot in Go! You’ll quickly see how valuable Bloom Filters can be for solving certain types of problems.

## References

- [Bloom Filter](https://en.wikipedia.org/wiki/Bloom_filter)
- [Scalable Bloom Filters](https://gsd.di.uminho.pt/members/cbm/ps/dbloom.pdf)
- [Bloom Filter Calculator](https://hur.st/bloomfilter/)
